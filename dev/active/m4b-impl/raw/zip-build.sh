set -u
echo "uname=$(uname -sm) node=$(node -v) npm=$(npm -v)"
for z in m1 m2; do
  rm -rf /tmp/$z && cp -r /w/$z /tmp/$z && cd /tmp/$z
  npm ci --no-audit --no-fund > /tmp/$z.ci.log 2>&1; ci=$?
  npm run build > /tmp/$z.build.log 2>&1; b=$?
  echo "$z npm_ci_exit=$ci build_exit=$b"; tail -6 /tmp/$z.build.log
  rm -rf node_modules dist
  npm install --no-audit --no-fund > /tmp/$z.inst.log 2>&1; i=$?
  npm run build > /tmp/$z.build2.log 2>&1; b2=$?
  echo "$z npm_install_exit=$i build_exit=$b2"
done
