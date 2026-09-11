// 长门有希桌宠（从 MascotYuki.exe 逆向提取的双形态序列帧）
export type YukiMascotConfig = {
	enable: boolean; // 是否启用
	// 模型资源目录（含 yuki.json / yuki.atlas / yuki.png / voices/）
	basePath: string;
	position?: {
		corner?: "bottom-left" | "bottom-right"; // 显示位置，默认 bottom-left
		offsetX?: number; // 距左右边缘偏移，默认 0
		offsetY?: number; // 距上下边缘偏移，默认 0
	};
	size?: {
		width?: number; // 容器宽度，默认 96
		height?: number; // 容器高度，默认 96
	};
	// 音量 0~1
	volume?: number;
	// 初始形态：A（普通）或 B（戴眼镜）
	defaultForm?: "A" | "B";
	zIndex?: number;
	responsive?: {
		hideOnMobile?: boolean;
		mobileBreakpoint?: number;
	};
};
