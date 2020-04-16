const Discord = require('discord.js')

const client = new Discord.Client()

client.on('ready', () => {
    console.log('I am ready !')
})

client.on('message', async message => {
    const parsedMessage = message.content.split(' ')

    if (parsedMessage[0] === '-sp' && parsedMessage[1] !== undefined) {
        parsedMessage.shift()
        const game = parsedMessage.join(' ')

        const botMessage = await message.channel.send(`@here ${message.author.username} wants to play at ${game}`)
        botMessage.player = message.author
        botMessage.players = []
        botMessage.game = game
        botMessage.react('☝️')
    }
})

client.on('messageReactionAdd', (reaction, user) => {
    if (!reaction.message.author.bot) return
    if (user.bot) return
    if (reaction.message.players.includes(user.id)) return

    if (reaction.emoji.name === '☝️') {
        reaction.message.players.push(user.id)
        reaction.message.player.send(`${reaction.message.guild.name} : 
            ${user.username} wants to play with you at ${reaction.message.game} !`)
    }
})



client.login('NzAwMjkwMTI3NDYwODI3MTU4.Xpgy6A.hftjEAbRxEW28588DtIYZDGaAH0')