const Discord = require('discord.js');
const config = require('./config.json');
const fs = require('fs');

const client = new Discord.Client({
  max_message_cache: 5,
});

const prefix = '🔨';

client.on('ready', () => {
  console.log('ready!');
});

function genLog(banner, banned, reason, channel, ban, owner) {
  fs.writeFileSync(`./out/${Date.now()}.json`, JSON.stringify({
    banner: banner.id,
    banned: banned.id,
    reason,
    messages: {
      channel,
      ban,
      owner,
    },
  }));
}

function hasPermission(member) {
  if (member.id === config.owner) {
    return true;
  }
  for (const role of member.roles) {
    if (config.roles.includes(role.name.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function generateLolYouGotBanned(user, banner, owner, reason) {
  return [
    `Hey ${user.username},\n`,
    'you recently lost send message permissions in the discord.js help channel because a user with high authority' +
    `saw fit to do so. You may appeal to ${owner} if you wish.\n`,
    `Banner: ${banner.username}#${banner.discriminator} (${banner})`,
    `Reason: ${reason}\n`,
    'It is entirely possible this was a mistake, in this case please do contact ' +
    `${owner.username}#${owner.discriminator} ${owner} to clear this up.\n`,
    'Thank you.',
  ].join('\n');
}

function generateOwnerMessage(toBan, banner, reason) {
  return [
    `${toBan.username}#${toBan.discriminator} (${toBan}) was banned at ${Date.now()}`,
    `Banner: ${banner.username}#${banner.discriminator} (${banner}) `,
    `Reason: ${reason}`,
  ].join('\n');
}

client.on('message', message => {
  if (message.channel.id !== config.channel || !message.content.startsWith(prefix)) {
    return;
  }

  if (message.mentions.users.size === 0) {
    return;
  }

  if (!hasPermission(message.member)) {
    return;
  }

  const banMessage = message.content.split(' ').slice(2).join(' ') || 'unspecified reason';
  const owner = client.users.get(config.owner);
  const toBan = message.mentions.users.array()[0];

  if (hasPermission(message.guild.member(toBan))) {
    return message.reply('You cannot ban this user');
  }

  if (message.channel.permissionsFor(toBan) && !message.channel.permissionsFor(toBan).hasPermission('SEND_MESSAGES')) {
    return message.reply('That user is already softbanned.');
  }

  message.channel.overwritePermissions(toBan, {
    SEND_MESSAGES: false,
  })
  .then(() => {
    const channMessage = `${toBan} has lost send permissions here and ${owner.username} has been notified.`;
    const bannedMessage = generateLolYouGotBanned(toBan, message.author, owner, banMessage);
    const ownerMessage = generateOwnerMessage(toBan, message.author, banMessage);
    genLog(message.author, toBan, banMessage, channMessage, bannedMessage, ownerMessage);
    message.channel.sendMessage(channMessage);
    toBan.sendMessage(bannedMessage);
    owner.sendMessage(ownerMessage);
  })
  .catch(e => {
    message.reply(`Couldn't ban - ${e}`);
  });
});

client.on('error', process.exit);

client.login(config.token);
