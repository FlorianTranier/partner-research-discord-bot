require('dotenv').config()
const Discord = require('discord.js')
const fs = require('fs')
const moment = require('moment')
const client = new Discord.Client()

const saveChannel = (guildId, channelId) => {
    if (!fs.existsSync('botChannels.json')) {
        fs.writeFileSync('botChannels.json', '{}')
    }
    const alreadyExistingChannels = JSON.parse(fs.readFileSync('botChannels.json', 'utf8'))
    alreadyExistingChannels[guildId] = channelId
    fs.writeFileSync('botChannels.json', JSON.stringify(alreadyExistingChannels))
}

const getBotChannelId = (guildId) => {
    const channels = JSON.parse(fs.readFileSync('botChannels.json', 'utf8'))
    return channels[guildId]
}

const addMutedChannel = (guildId, channelId) => {
    if (!fs.existsSync('mutedChannels.json')) {
        fs.writeFileSync('mutedChannels.json', '{}')
    }
    const alreadyExistingChannels = JSON.parse(fs.readFileSync('mutedChannels.json', 'utf8'))
    if (!alreadyExistingChannels[guildId]) {
        alreadyExistingChannels[guildId] = [channelId]
    } else {
        alreadyExistingChannels[guildId].push(channelId)
    }

    fs.writeFileSync('mutedChannels.json', JSON.stringify(alreadyExistingChannels))
}

const createEmbedMessage = async (title, description, author, players) => {
    const message = new Discord.MessageEmbed()
    const voiceState = author.presence.member.voice
    message
        .setColor('#FF2A2A')
        .setTitle(title)
        .addField('Answering the call', description ? description : `Waiting for players`)
        .setAuthor(author.username, author.avatarURL())
        
    players.forEach(player => message.setImage(player.avatarURL()))
    
    if (voiceState && voiceState.channel) {
        const invite = await voiceState.channel.createInvite()
        message.addField(
            'Join Channel : ',
            `[🔊 ${voiceState.channel.name}](${invite.url})`
        )
    }
    
    return message
}

client.on('ready', () => {
    console.log('I am ready !')
})

client.on('message', async message => {
    const parsedMessage = message.content.split(' ')

    if (parsedMessage[0] === '-sp' && parsedMessage[1] !== undefined) {
        parsedMessage.shift()
        const game = parsedMessage.join(' ')

        const botMessage = await message.channel.send(
            `@here `,
            await createEmbedMessage(`${message.author.username} wants to play at ${game}`,
            ``, message.author, [])
        )
        botMessage.player = message.author
        botMessage.players = []
        botMessage.game = game
        botMessage.react('☝️')
        botMessage.originalContent = botMessage.embeds[0].title
        await message.delete()
    }

    if (parsedMessage[0] === '-clean' && parsedMessage[1] === undefined) {
        const toDelete = (await message.channel.messages.fetch({limit: 99}))
            .filter(msg => msg.author.id === client.user.id)
        await message.channel.bulkDelete(toDelete)
        await message.delete()
    }
})

client.on('messageReactionAdd', async (reaction, user) => {
    if (!reaction.message.author.bot) return
    if (user.bot) return

    if (reaction.emoji.name === '☝️') {
        reaction.message.players.push(user)
        let updatedMessageContent = ``
        reaction.message.players.forEach((player, index) => {
            updatedMessageContent += `<@${player.id}>`
            if (index !== reaction.message.players.length-1) updatedMessageContent += ', '
        });
        reaction.message.edit(
            await createEmbedMessage(
                reaction.message.originalContent,
                updatedMessageContent,
                reaction.message.player,
                reaction.message.players
            )
        )
    }
})

client.on('messageReactionRemove', async (reaction, user) => {
    if (!reaction.message.author.bot) return
    if (user.bot) return

    if (reaction.emoji.name === '☝️') {
        reaction.message.players = reaction.message.players.filter(player => player !== user)
        let updatedMessageContent = ``
        reaction.message.players.forEach((player, index) => {
            updatedMessageContent += player.username
            if (index !== reaction.message.players.length-1) updatedMessageContent += ', '
        });
        reaction.message.edit(
            await createEmbedMessage(
                reaction.message.originalContent,
                updatedMessageContent,
                reaction.message.player,
                reaction.message.players
            )
        )
    }
})

client.on('voiceStateUpdate', async (oldVoiceState, newVoiceState) => {
    let newUserChannel = newVoiceState.channel
    let oldUserChannel = oldVoiceState.channel



    const botChannel = await client.channels.fetch(getBotChannelId(newVoiceState.guild.id))

    if (botChannel.lastMessage.player === newVoiceState.member.user) {
        const updatedMessage = await createEmbedMessage(
            botChannel.lastMessage.originalContent,
            botChannel.lastMessage.embeds[0].description,
            botChannel.lastMessage.player,
            botChannel.lastMessage.players
        )
        botChannel.lastMessage.edit(updatedMessage)
    }
        
})


client.login(process.env.BOT_TOKEN)