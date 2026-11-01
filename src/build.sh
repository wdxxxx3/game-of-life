#!/bin/sh
# Rebuild ../index.html from the sources in this folder.
# patterns.json is rebuilt separately: run extract.py on a Golly source tree, then `node build_patterns.js`.
cd "$(dirname "$0")"
{
  cat <<'HEAD'
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="基于 HashLife 的康威生命游戏：无限画布、245 个分类图样、可运行的图书馆文章与书单。">
<style>html{color-scheme:dark}body{margin:0;font:14px system-ui,sans-serif}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
HEAD
  sed -n '1,/^<canvas id="stage"/p' head.html | sed '$d' | grep -v 'claude:viewport-fit-sides'
  echo '</head>'; echo '<body>'
  sed -n '/^<canvas id="stage"/,$p' head.html
  echo '<script>'; sed '/^if (typeof module/d' engine.js; cat ui.js lib.js essays.js read.js; echo '</script>'
  echo '</body>'; echo '</html>'
} > ../index.html
