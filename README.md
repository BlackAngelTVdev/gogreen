# 🌱 goGreen

With **goGreen**, you can make your profile look like you've been hard at work... even if you haven't.
NodeJs script to make commits to the past (or the future) to go green on GitHub.

## About

**goGreen** helps you create commits on your GitHub profile for any date in the past. Whether you want to fill up your contribution graph or even make cool patterns and artwork.

## Getting Started

> ⚠️ This rewrites your contribution history by creating real commits. Use a throwaway repo first.

1. **Clone this repository**
```bash
git clone https://github.com/fenrir2608/goGreen.git
cd goGreen
```

2. **Install dependencies**
```bash
npm install
```

3. **Run**
```bash
npm run start
```

### Notes

- The script creates commits dated over the last year and pushes **once at the end**.
- Change the number of commits in `index.js` (`makeCommits(100)`).

## Room for Improvement

- **Custom Patterns:** Experiment with different patterns on your contribution graph. Maybe spell out your name or create some cool designs.
- **Density Control:** Play around with the number of commits per day to adjust the shades of green.
- **Input Strings:** Convert input strings to X-Y mapped contributions.

## npm Modules Used

- [`moment`](https://www.npmjs.com/package/moment) - Handles date and time manipulation.
- [`simple-git`](https://www.npmjs.com/package/simple-git) - For easy Git commands.
- [`random`](https://www.npmjs.com/package/random) - To generate random numbers for the commits.

## Credits

Huge thanks to [Akshay Saini](https://github.com/akshaymarch7) for the original video behind this project.
