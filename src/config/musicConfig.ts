import type { MusicPlayerConfig } from "../types/musicConfig";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 是否在导航栏显示音乐播放器入口
	showInNavbar: true,

	// 是否在侧边栏显示音乐播放器组件
	showInSidebar: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "local",

	// 默认音量 (0-1)
	volume: 0.7,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "list",

	// 是否显启用歌词
	showLyrics: false,

	// Meting API 配置
	meting: {
		// Meting API 地址
		// 默认使用官方 API，也可以使用自定义 API
		api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		server: "netease",
		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		type: "playlist",
		// 歌单/专辑/单曲 ID 或搜索关键词
		id: "",
		// 认证 token（可选）
		auth: "",
		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis: [
			"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},

	// 本地音乐配置（当 mode 为 'local' 时使用）
	// 1. 支持传入歌词文件的路径
	// lrc: "/assets/music/lrc/使一颗心免于哀伤-哼唱.lrc",
	// 2. 或者直接填入歌词字符串内容
	// lrc: "[00:00.00]歌词内容...",
	local: {
		playlist: [
			{
				name: "That's All",
				artist: "Barney Kessel",
				url: "/assets/music/Barney Kessel - That's All.mp4",
				cover: "/assets/music/cover/cover-01.jpg",
			},
			{
				name: "You Got to My Head",
				artist: "Barney Kessel",
				url: "/assets/music/Barney Kessel - You Got to My Head.mp4",
				cover: "/assets/music/cover/cover-02.jpg",
			},
			{
				name: "What Are You Doing The Rest Of Your Life",
				artist: "Bill Evans",
				url: "/assets/music/Bill Evans - What Are You Doing The Rest Of Your Life.mp4",
				cover: "/assets/music/cover/cover-03.jpg",
			},
			{
				name: "Road To Gundaghi  Waltzing Matilda (Album Version)",
				artist: "Chet Atkins, Tommy Emmanuel",
				url: "/assets/music/Chet Atkins,Tommy Emmanuel - Road To Gundaghi  Waltzing Matilda (Album Version).mp4",
				cover: "/assets/music/cover/cover-04.jpg",
			},
			{
				name: "旅立ちの日",
				artist: "DEPAPEPE",
				url: "/assets/music/DEPAPEPE - 旅立ちの日.mp4",
				cover: "/assets/music/cover/cover-05.jpg",
			},
			{
				name: "いい日だったね。",
				artist: "DEPAPEPE",
				url: "/assets/music/DEPAPEPE - いい日だったね。.mp4",
				cover: "/assets/music/cover/cover-06.jpg",
			},
			{
				name: "きっとまたいつか（album version）",
				artist: "DEPAPEPE",
				url: "/assets/music/DEPAPEPE - きっとまたいつか（album version）.mp4",
				cover: "/assets/music/cover/cover-07.jpg",
			},
			{
				name: "Wake Me Up When September Ends",
				artist: "Green Day, Francesco Digilio, Federico Labbiento",
				url: "/assets/music/Green Day,Francesco Digilio, Federico Labbiento - Wake Me Up When September Ends.mp4",
				cover: "/assets/music/cover/cover-08.jpg",
			},
			{
				name: "Ladyfingers",
				artist: "Herb Alpert & the Tijuana Brass",
				url: "/assets/music/Herb Alpert & the Tijuana Brass - Ladyfingers.mp4",
				cover: "/assets/music/cover/cover-09.jpg",
			},
			{
				name: "Carcelera",
				artist: "Sabicas",
				url: "/assets/music/Sabicas - Carcelera.mp4",
				cover: "/assets/music/cover/cover-10.jpg",
			},
			{
				name: "fish in the pool・花屋敷",
				artist: "ヘクとパスカル",
				url: "/assets/music/ヘクとパスカル - fish in the pool・花屋敷.mp4",
				cover: "/assets/music/cover/cover-11.jpg",
			},
		],
	},
};
