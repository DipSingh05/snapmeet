import translate from 'translate-google-api';

const result = await translate('मैं ठीक हूँ।', {
  to: "en",
});

console.log(result[0]);
