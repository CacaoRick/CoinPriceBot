export default function delay (interval) {
  return new Promise((resolve) => {
    setTimeout(resolve, interval)
  })
}
