# CCWS 目标管理应用

一个功能丰富的 PWA 目标管理应用，支持 Windows 和 iPhone 多设备同步。

## 功能特性

### 核心功能
- ✅ **树状目标结构** - 支持无限层级子目标
- ✅ **完成打勾** - 复选框，点击即完成
- ✅ **状态切换** - 待完成/进行中/已完成/已取消
- ✅ **倒计时** - 显示距离截止还有多少天
- ✅ **搜索功能** - 快速查找目标
- ✅ **拖拽排序** - 自由调整顺序

### 分类管理
- ✅ **标签系统** - 给目标添加标签
- ✅ **优先级** - 高/中/低优先级
- ✅ **文件夹** - 按类别分组管理

### 时间管理
- ✅ **日历视图** - 按日期查看目标
- ✅ **重复目标** - 每日/每周/每月重复
- ✅ **提醒功能** - 目标到期前提醒

### 数据可视化
- ✅ **进度统计** - 本周/本月完成数量
- ✅ **完成率图表** - 可视化目标完成情况

### 数据管理
- ✅ **回收站** - 误删可恢复（30天）
- ✅ **批量操作** - 一次操作多个目标
- ✅ **导出功能** - 导出为 JSON/CSV

### 界面体验
- ✅ **深色模式** - 暗黑主题
- ✅ **响应式设计** - 手机/电脑适配
- ✅ **动画效果** - 流畅的交互动画

### PWA 功能
- ✅ **离线使用** - 断网也能正常操作
- ✅ **添加到主屏幕** - iPhone 全屏使用
- ✅ **推送通知** - 浏览器通知提醒
- ✅ **云端同步** - 多设备数据实时同步

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Firebase

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目
3. 添加 Web 应用
4. 复制配置信息到 `src/lib/firebase.ts`

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

## 部署

### Vercel（推荐）

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com/)
3. 导入 GitHub 仓库
4. 自动部署

### Netlify

1. 访问 [Netlify](https://www.netlify.com/)
2. 拖拽 `dist` 文件夹
3. 自动部署

## iPhone 使用方法

1. 用 Safari 访问你的网站
2. 点击底部"分享"按钮
3. 选择"添加到主屏幕"
4. 像 App 一样全屏使用

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Firebase Firestore（实时数据库）
- **认证**: Firebase Auth（邮箱/Google 登录）
- **部署**: Vercel / Netlify
- **PWA**: Service Worker + manifest.json

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Auth/           # 认证组件
│   ├── GoalTree/       # 目标树
│   ├── GoalDetail/     # 目标详情
│   ├── KeyGoals/       # 重点目标
│   ├── Calendar/       # 日历视图
│   ├── Stats/          # 统计面板
│   ├── Folder/         # 文件夹
│   └── Trash/          # 回收站
├── pages/              # 页面组件
├── hooks/              # 自定义 Hooks
├── lib/                # 工具函数
│   ├── firebase.ts     # Firebase 配置
│   └── db.ts           # 数据库操作
└── App.tsx             # 主应用
```

## 费用

- **Firebase**: 免费额度（1GB 存储，10GB/月流量）
- **托管**: Vercel/Netlify 免费
- **总计**: $0（完全免费）

## 许可证

MIT
