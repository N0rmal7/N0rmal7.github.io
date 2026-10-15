import assert from "node:assert/strict";
import { createCipheriv, createHmac, pbkdf2Sync, webcrypto } from "node:crypto";
import { test } from "node:test";
import { encryptContent } from "../src/utils/crypto-utils";
import { fromHtml } from "hast-util-from-html";
import { computeTocItems, renderTocItemHTML } from "../src/utils/toc-shared";

// Match the browser's Web Crypto reader, including its tag-at-the-end layout.
async function browserDecrypt(payload: string, password: string): Promise<string> {
  const bytes = Buffer.from(payload, "base64");
  const material = await webcrypto.subtle.importKey("raw", Buffer.from(password), "PBKDF2", false, ["deriveKey"]);
  const key = await webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt: bytes.subarray(0, 16), iterations: 100000, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["decrypt"],
  );
  const combined = Buffer.concat([bytes.subarray(44), bytes.subarray(28, 44)]);
  const plaintext = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.subarray(16, 28) }, key, combined);
  return new TextDecoder().decode(plaintext);
}

test("edited articles never reuse salt or IV, and browser decryption preserves HTML", async () => {
  const password = "test-only-password";
  const html = '<h2>中文 &amp; HTML</h2><pre>puts("hello")</pre>';
  const first = encryptContent(html, password, "same-article");
  const second = encryptContent(html + " updated", password, "same-article");
  const a = Buffer.from(first, "base64"), b = Buffer.from(second, "base64");
  assert.notDeepEqual(a.subarray(0, 16), b.subarray(0, 16));
  assert.notDeepEqual(a.subarray(16, 28), b.subarray(16, 28));
  assert.equal(await browserDecrypt(first, password), html);
  assert.equal(await browserDecrypt(second, password), html + " updated");
});

test("wrong passwords and modified ciphertext or authentication tags are rejected", async () => {
  const payload = encryptContent("private article", "correct-password", "article");
  await assert.rejects(browserDecrypt(payload, "wrong-password"));
  for (const offset of [28, 44]) {
    const tampered = Buffer.from(payload, "base64");
    tampered[offset] ^= 1;
    await assert.rejects(browserDecrypt(tampered.toString("base64"), "correct-password"));
  }
});

test("previously published encrypted payloads remain readable", async () => {
  const password = "legacy-test-password", slug = "old-article", html = "<p>旧文章</p>";
  const salt = createHmac("sha256", password).update(`salt:${slug}`).digest().subarray(0, 16);
  const iv = createHmac("sha256", password).update(`iv:${slug}`).digest().subarray(0, 12);
  const key = pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(html, "utf8"), cipher.final()]);
  const payload = Buffer.concat([salt, iv, cipher.getAuthTag(), ciphertext]).toString("base64");
  assert.equal(await browserDecrypt(payload, password), html);
});

test("literal heading text and quoted anchors cannot become active HTML in the client TOC", () => {
  const text = '<img src=x onerror="alert(1)"> & 中文';
  const slug = 'section" onmouseover="alert(1)';
  const [item] = computeTocItems([{ depth: 2, slug, text }], { maxLevel: 3 });
  const tree = fromHtml(renderTocItemHTML(item), { fragment: true });
  const elements: any[] = [];
  function visit(node: any) {
    if (node.type === "element") elements.push(node);
    for (const child of node.children || []) visit(child);
  }
  visit(tree);
  assert.equal(elements.some(node => ["img", "script"].includes(node.tagName)), false);
  assert.equal(elements.some(node => Object.keys(node.properties).some(key => /^on/i.test(key))), false);
  const link = elements.find(node => node.tagName === "a");
  assert.equal(link.properties.href, `#${slug}`);
  const label = elements.find(node => node.properties.className?.includes("toc-label"));
  assert.equal(label.children[0].value, text);
});
