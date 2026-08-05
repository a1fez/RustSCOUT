const { GameDig } = require('gamedig');

async function testMooseOnline() {
  try {
    const state = await GameDig.query({
      type: 'rust',
      host: 'monday.us.moose.gg',
      port: 28015,
      givenPortOnly: true,
      requestTimeout: 3000
    });

    console.log('--- ПРОВЕРКА ПОЛЕЙ ОНЛАЙНА ---');
    console.log(`1. state.players.length: ${state.players.length}`);
    console.log(`2. state.numplayers:     ${state.numplayers}`);
    console.log(`3. state.raw.numplayers: ${state.raw?.numplayers}`);
    console.log(`4. state.raw.players:    ${state.raw?.players}`);
    console.log(`5. state.maxplayers:     ${state.maxplayers}`);
    console.log('-----------------------------');

    // Универсальный хак для получения точного онлайна:
    const realPlayers = state.raw?.numplayers ?? state.numplayers ?? state.players.length ?? 0;
    
    console.log(`\n🔥 Реальный онлайн сервера: ${realPlayers} / ${state.maxplayers}`);

  } catch (err) {
    console.error('❌ Ошибка:', err.message);
  }
}

testMooseOnline();