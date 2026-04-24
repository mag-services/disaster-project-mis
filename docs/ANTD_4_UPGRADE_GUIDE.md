# Ant Design 3.x → 4.x 升级分析报告与指南

## 一、项目架构概览

### 1.1 技术栈
- **框架**: React 19 + Zustand
- **构建**: Vite 7
- **UI 库**: antd 3.16.3
- **路由**: react-router
- **地图**: Leaflet + react-leaflet + protomaps-leaflet

### 1.2 关键依赖与 antd 关系

| 依赖包 | 版本 | 与 antd 关系 | 升级影响 |
|--------|------|--------------|----------|
| **antd** | 3.16.3 | 核心 UI 库 | 直接升级目标 |
| **ant-design-pro** | ^1.4.4 | peerDep: antd ^3.0.1 | 项目中未直接 import，可移除 |
| **k-ui-react** | ^1.0.47 | 直接依赖 antd ^3.1.1 | 需 npm overrides 强制使用 antd 4 |
| **babel-plugin-import** | ^1.11.0 | 按需加载 antd | 配置兼容 antd 4 |

---

## 二、需修改文件清单

### 2.1 必须修改（破坏性变更）

#### A. LocaleProvider → ConfigProvider
| 文件 | 修改内容 |
|------|----------|
| `src/index.js` | `LocaleProvider` → `ConfigProvider`；`antd/lib/locale-provider/zh_CN` → `antd/es/locale/zh_CN` |

#### B. Icon 组件（约 20+ 处）
antd 4 移除 `Icon` 的 `type` 字符串，需改用 `@ant-design/icons` 具体组件。

| 文件 | 典型用法 | 替换方式 |
|------|----------|----------|
| `src/container/content/content.js` | `<Icon type={menu.icon} />` | 新建 `MenuIcon` 组件，区分 iconfont(`icon-*`) 与标准图标 |
| `src/pages/usermmt/user/list/index.jsx` | `<Icon type='exclamation-circle' />` | `import { ExclamationCircleFilled } from '@ant-design/icons'` |
| `src/pages/usermmt/user/list/subpage/selectCpn.jsx` | `Icon` | 替换为对应 `@ant-design/icons` 组件 |
| `src/pages/usermmt/user/debtManage/debtDetail/adjust.jsx` | `Icon type='question-circle-o'` | `QuestionCircleOutlined` |
| `src/pages/usermmt/label/detail/subpage/UserTable/index.jsx` | `icon: <Icon type='exclamation-circle' />` | `icon: <ExclamationCircleFilled />` |
| `src/pages/usermmt/label/list/subpage/list.jsx` | 同上 | 同上 |
| 其他含 `Icon` 的页面 | 按类型逐一替换 | 见下方图标映射表 |

**常用图标映射**：
- `question-circle-o` → `QuestionCircleOutlined`
- `exclamation-circle` (theme filled) → `ExclamationCircleFilled`
- `edit` → `EditOutlined`
- `loading` → `LoadingOutlined`
- `bars` → `MenuFoldOutlined` / `MenuUnfoldOutlined`

#### C. DatePicker locale 路径
| 文件 | 原路径 | 新路径 |
|------|--------|--------|
| `src/components/datePicker/subpage/datePicker.jsx` | `antd/lib/date-picker/locale/zh_CN` | `antd/es/date-picker/locale/zh_CN` |
| `src/components/datePicker/subpage/rangePicker.jsx` | 同上 | 同上 |

#### D. Modal.confirm 的 icon 参数
部分 `Modal.confirm` 使用 `icon: <Icon type='...' />` 或 `iconType`，需改为传入 `@ant-design/icons` 组件。

| 文件 | 修改点 |
|------|--------|
| `src/pages/usermmt/user/list/index.jsx` | `iconType` → `icon`，传入 React 节点 |
| `src/pages/usermmt/label/detail/subpage/UserTable/index.jsx` | `icon: <Icon .../>` → `icon: <ExclamationCircleFilled />` |

### 2.2 Form 相关（若使用 antd Form）

项目若使用 antd 3 的 `Form.create()` / `getFieldDecorator`，需二选一：
- **方案 A（推荐）**：使用 `@ant-design/compatible` 的 `Form`，保持旧 API
- **方案 B**：迁移到 antd 4 新 Form API（`Form.Item` + `name`）

经检索，当前项目**未使用** `Form.create` / `getFieldDecorator`，可跳过。

### 2.3 可选优化

- **Typography**：`Text`、`Paragraph` 等 API 有调整，按需适配
- **Table**：`pagination` 等部分 props 有变更，需对照文档
- **Less 变量**：若使用 antd 的 Less 变量定制主题，需迁移到 CSS 变量或 ConfigProvider `theme`

---

## 三、package.json 修改

```json
{
  "dependencies": {
    "@ant-design/compatible": "^1.2.2",
    "@ant-design/icons": "^4.8.0",
    "antd": "^4.24.16"
  },
  "overrides": {
    "k-ui-react": {
      "antd": "^4.24.16"
    }
  }
}
```

- 移除 `ant-design-pro`（未使用且 peerDep 限制 antd ^3）
- 添加 `overrides` 确保 `k-ui-react` 使用 antd 4（npm 8.3+）

---

## 四、菜单图标 (iconfont) 处理

`src/constant/describeMenu.js` 中菜单配置含两类图标：
- **标准 antd**：`bars`、`form`、`file-text`、`notification`、`share-alt`
- **自定义 iconfont**：`icon-cloudServer`、`icon-financialCenter`、`icon-EIP` 等

**建议**：新建 `src/components/menuIcon/index.jsx`，根据 `type` 前缀区分：
- `icon-*` → 渲染 `<i className={'anticon iconfont ' + type} />`（沿用现有 iconfont.less）
- 其他 → 映射到 `@ant-design/icons` 对应组件

---

## 五、升级步骤建议

1. **备份**：`git checkout -b antd4-upgrade`
2. **修改 package.json**：按第三节更新依赖与 overrides
3. **执行**：`npm install`
4. **运行 codemod**（可选）：`npx @ant-design/codemod-v4 src` 自动迁移部分用法
5. **手动修改**：按第二节逐项修改
6. **验证**：`npm run build`、`npm run dev`，重点检查登录、地图、表单、弹窗
7. **回归测试**：覆盖主要业务流程

---

## 六、注意事项

1. **k-ui-react**：强依赖 antd 3，需确认其与 antd 4 的兼容性；若存在兼容问题，需考虑替换或 fork 维护
2. **CORS**：开发时 PMTiles 等 URL 若指向 `localhost:8000`，需通过 Vite 代理或改为相对路径，避免跨域
3. **样式**：antd 4 默认样式有调整，需检查全局样式、自定义主题是否冲突
4. **React 19**：antd 4 官方主要支持 React 16/17/18，与 React 19 可能存在兼容性问题，需实测

---

## 附录：涉及 Icon 的文件列表（需逐一检查）

- `src/container/content/content.js` - 菜单图标（动态 type）
- `src/pages/usermmt/user/userInfo/component/renew.jsx`
- `src/pages/usermmt/user/userInfo/component/mouth.jsx`
- `src/pages/usermmt/user/userInfo/component/credit.jsx`
- `src/pages/usermmt/user/open/content/form/debt/index.jsx`
- `src/pages/usermmt/user/open/content/form/contract/index.jsx`
- `src/pages/usermmt/user/list/subpage/selectCpn.jsx`
- `src/pages/usermmt/user/list/index.jsx`
- `src/pages/usermmt/user/debtManage/debtDetail/index.jsx`
- `src/pages/usermmt/user/debtManage/debtDetail/adjust.jsx`
- `src/pages/usermmt/user/addNewUser/index.jsx`
- `src/pages/usermmt/label/list/subpage/list.jsx`
- `src/pages/usermmt/label/detail/subpage/UserTable/index.jsx`