source ~/.bashrc
nvm use 14
echo "Deploying..."
yarn
yarn server:build
pm2 reload all
