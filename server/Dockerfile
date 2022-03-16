FROM node:16
EXPOSE 3000
WORKDIR /golnft

# Setting default timezone
ENV TZ=Asia/Kuala_Lumpur

# npm packages
COPY package*.json ./
RUN npm config set update-notifier false
RUN npm install

# Actual codes
COPY . /golnft/
CMD ["npm", "start"]
