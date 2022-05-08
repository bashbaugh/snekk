source ~/.bashrc
echo "Deploying..."
yarn
yarn server:build
pm2 reload all
