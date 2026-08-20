FROM node:24

WORKDIR /app-konkantrip

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]