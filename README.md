# Neon Jokenpo ✊✋✌️

A modern, real-time Rock-Paper-Scissors game that runs entirely in the browser using Peer-to-Peer (WebRTC) technology.

**Play now**: [Your GitHub Pages Link Here]

## Features
- **PvC Mode**: Play against the computer immediately.
- **PvP Mode**: Play against a friend in real-time.
    - **Serverless**: Connects directly via PeerJS. No backend server required!
    - **Shareable Links**: Generate a unique link and send it to your friend to join your game instantly.
- **Neon UI**: Modern dark theme with neon animations.
- **Celebrations**: Confetti party on victory! 🎉

## How to Deploy (GitHub Pages)
Since this game uses PeerJS, it is a static site and can be hosted for free on GitHub Pages.

1.  **Fork/Clone** this repository.
2.  Go to **Settings** > **Pages**.
3.  Under **Source**, select `Deploy from a branch`.
4.  Select your branch (e.g., `main`) and the folder as `/public` (if you moved files there) or `/` (root).
    - *Note: Ensure `index.html`, `style.css`, and `script.js` are in the deployed directory.*
5.  Click **Save**.
6.  Wait a few seconds, refresh the page, and your game will be live at `https://<username>.github.io/<repo-name>/`.

## How to Play
1.  **Enter your Name**.
2.  **Select Mode**:
    - **Vs Computador**: Solo play.
    - **Vs Jogador**: 
        - You become the **Host**.
        - Copy the "Convide um amigo" link.
        - Send it to a friend.
        - When they open it, they will automatically join your session.
3.  **Battle**: Choose your move and see who wins!

## Credits
- Built with [PeerJS](https://peerjs.com/) for P2P networking.
- Confetti by [Wowify.js](https://github.com/satodu/Wowify.js).
- Made by [Panda](https://github.com/satodu).