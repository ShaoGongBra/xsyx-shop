module.exports = {
  asyncTimeOut: time => {
    return new Promise(resolve => {
      setTimeout(() => resolve(), time)
    })
  }
}