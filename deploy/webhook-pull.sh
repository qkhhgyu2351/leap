#!/bin/bash
# ============================================================
# 宝塔 WebHook 部署脚本
# 作用：GitHub 仓库 push 后，服务器自动拉取最新站点文件
# 用法：宝塔面板 → 软件商店 → WebHook → 添加 hook → 粘贴本脚本
#       并在 GitHub 仓库 Settings → Webhooks 指向该 hook 地址
# ============================================================

REPO="/www/wwwroot/leaping"   # 服务器上站点根目录（按实际修改）
BRANCH="main"                 # 仓库默认分支

cd "$REPO" || { echo "cd $REPO 失败"; exit 1; }

# 放弃服务器本地任何改动，保证与 GitHub 完全一致（纯静态站安全）
git reset --hard HEAD
git clean -fd

# 只做快进合并，避免产生 merge commit
git pull --ff-only origin "$BRANCH"

echo "deploy done: $(date)"
