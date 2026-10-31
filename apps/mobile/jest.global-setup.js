// Dates must be computed in local time; run tests in Argentina's timezone (UTC-3).
module.exports = () => {
  process.env.TZ = 'America/Argentina/Buenos_Aires'
}
