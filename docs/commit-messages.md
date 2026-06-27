# Commit Message Standard

This repository uses Conventional Commits plus the existing `commit-msg` hook.
The subject may be written with the correct emoji prefix or as a plain
Conventional Commit header. `@jannajs/lint emojify` adds or corrects the emoji
after commitlint passes.

## Shape

```text
[emoji] <type>(<scope>): <subject>

<why and what changed. Keep this compact, but include the real hard parts.>

<if the change improves future AI Coding quality or speed, explain the concrete
mechanism: stronger type checks, tests, agent docs, observability, or earlier
failure signals.>
```

## Rules

- Use Conventional Commit `type(scope): subject`, optionally prefixed by the
  matching emoji.
- Keep emoji handling in the hook; it adds missing emoji and corrects mismatched
  emoji.
- Put AI Coding quality or efficiency gains in the body when the change
  materially improves future agent work.
- Write the hard parts explicitly: architecture boundaries, API migration,
  framework quirks, validation gaps, or debugging paths that changed the
  implementation.
- Explain the concrete mechanism when it matters: what type validation, tests,
  agent instructions, docs, observability, or warning cleanup were added, and
  how that makes later AI Coding safer or faster.
- Avoid one sentence per paragraph. Use a small number of focused paragraphs.

## Examples

Feature with a breaking API change:

```text
feat(iconcat): 重构 monorepo catalog 架构

将单包 Tailwind 插件升级为 Iconcat monorepo，拆分 core、extractor、adapter 和示例应用，并把图标提取改为入口驱动的依赖图扫描。难点是同时稳定公共 API、框架 CSS 注入契约和构建产物边界。

这次变更包含破坏性 API 迁移：删除旧的 add*IconSelectors 命名和 preprocessSets 配置，迁移到 icons、dynamicIcons、staticIcons、catalogIcons 和 createIconcatCSSArtifact。迁移说明写入 docs/iconcat-tailwind-api-migration.md。

这次变更补强了后续 AI Coding 的质量保障：tsdown 包构建、tsgo 类型检查、Vitest 和三套示例应用生产构建共同覆盖声明产物、Next/Vite 注入和图标 CSS artifact 问题，减少人工预览盲区。
```

Build tooling change:

```text
build(packages): 统一包构建到 tsdown

将各 package 的 `rolldown && tsc` 构建脚本收敛为共享 tsdown 配置，保留默认 `.d.mts/.d.cts` 类型产物，并用条件 exports 对齐 ESM/CJS 类型解析。

这次构建工具迁移提升了后续 AI Coding 的反馈效率：先用单包探针构建验证产物形状，再升级到 Turborepo 全量包构建和 tsgo typecheck，避免一次性迁移后难以定位声明后缀、rootDir 和 worker warning 问题。
```

Test warning fix:

```text
test(tailwind): 延迟加载 Figma 集成测试依赖

将跳过态 Figma 测试的 node 入口改为测试体内动态 import，避免 Vitest 收集阶段加载 cross-fetch 旧依赖链并触发 Node punycode deprecation warning。

这次测试改动提升了后续 AI Coding 的判断质量：通过 `NODE_OPTIONS=--trace-deprecation` 和 require hook 定位到 whatwg-url/tr46 的顶层加载来源，再用最小测试改动清理噪音，避免无关 warning 干扰真实失败信号。
```
