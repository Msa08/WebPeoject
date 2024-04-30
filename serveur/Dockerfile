# Utilisez une image Node.js comme base
FROM node:22.0.0

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de votre application
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port sur lequel le serveur écoute
EXPOSE 4000

# Définir la commande de démarrage pour lancer le serveur
CMD ["npm", "start"]
