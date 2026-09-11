import type { YukiMascotConfig } from "../types/pioConfig";

// 长门有希桌宠（双形态：普通 / 戴眼镜），素材由 MascotYuki.exe 逆向提取
export const yukiMascotConfig: YukiMascotConfig = {
	// 开关：改为 false 可关闭
	enable: true,
	// 模型资源目录（含 yuki.json / yuki.atlas / yuki.png / voices/）
	basePath: "/yuki",
	// 位置：默认左下角
	position: {
		corner: "bottom-left",
		offsetX: 0,
		offsetY: 0,
	},
	// 容器尺寸（px）
	size: {
		width: 96,
		height: 96,
	},
	// 音量 0~1
	volume: 0.6,
	// 初始形态：A 普通 / B 戴眼镜
	defaultForm: "A",
	// 层级
	zIndex: 1000,
	// 响应式：移动端隐藏
	responsive: {
		hideOnMobile: true,
		mobileBreakpoint: 768,
	},
};
