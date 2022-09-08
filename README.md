# Blacklist-word-replacer

Discord bot written in typescript to replace words
[Invitation link](https://discord.com/api/oauth2/authorize?client_id=866337716995883009&permissions=275414789120&scope=bot%20applications.commands)

## Setup

### Install dependencies and transpile code

```bash
npm install
npx tsc
```

### Configure env

Create a .env file in the project root and replace `MYTOKEN` with your bot's token

```sh
BOT_TOKEN=MYTOKEN
```

### Deploy commands
You need to deploy commands to make slash commands visible and usable
```bash
npm run deploy
```

### Run

```bash
npm run start
```
