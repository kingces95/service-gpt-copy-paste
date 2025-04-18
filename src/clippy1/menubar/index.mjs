import { menubar } from 'menubar';
import { fileURLToPath } from 'url';
import path from 'path';
import { Menu, app } from 'electron';
import ClippyService from '../core/clippy-service.mjs';

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to icons
const processingAPath = path.join(__dirname, 'assets', 'processing_a.png');
const processingBPath = path.join(__dirname, 'assets', 'processing_b.png');
const listenging = path.join(__dirname, 'assets', 'listening.png');
const idle = path.join(__dirname, 'assets', 'idle.png');

// Symbols for different states
const symbols = {
  success: '✔',
  warning: '⚠',
  failure: '✖'
};

// Create the menubar instance
const mb = menubar({
  index: 'about:blank',
  icon: idle, // Start with grayscale icon
  preloadWindow: false
});

let lastState = 'Listening...'; // Track the current state
const messageBuffer = []; // Buffer to hold the last three messages

// Timer for animation
let animationInterval = null;

const updateTooltip = () => {
  const tooltip = [...messageBuffer.slice(-1), lastState].join('\n');
  mb.tray.setToolTip(tooltip);
};

// Start animation
const startAnimation = () => {
  let toggle = false;
  stopAnimation(); // Ensure no duplicate timers
  animationInterval = setInterval(() => {
    mb.tray.setImage(toggle ? processingAPath : processingBPath);
    toggle = !toggle;
  }, 90); 
};

// Stop animation
const stopAnimation = () => {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
};

mb.on('ready', () => {
  console.log('Menubar app ready.');

  const createContextMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Interrupt',
        click: () => {
          console.log('Interrupt clicked');
          process.kill(process.pid, 'SIGINT'); // Simulate Ctrl+C
        }
      },
      {
        label: 'Quit',
        click: () => {
          console.log('Quit clicked');
          app.quit(); // Quit the application
        }
      }
    ]);
    mb.tray.setContextMenu(contextMenu);
  };

  createContextMenu(); // Attach the menu when ready

  ClippyService.start((service) => {
    service.on('listening', () => {
      lastState = 'Listening...';
      updateTooltip();
      stopAnimation(); // Stop animation
      mb.tray.setImage(idle); // Set grayscale icon while listening
    });

    service.on('processing', () => {
      lastState = 'Processing...';
      updateTooltip();
      startAnimation(); // Start animating between icons
    });

    service.on('success', (message) => {
      messageBuffer.push(`${symbols.success} ${message}`);
      updateTooltip();
    });

    service.on('warning', (message) => {
      messageBuffer.push(`${symbols.warning} ${message}`);
      updateTooltip();
    });

    service.on('failure', (message) => {
      messageBuffer.push(`${symbols.failure} ${message}`);
      updateTooltip();
    });

    service.on('error', (error) => {
      messageBuffer.push(`${symbols.failure} Error Encountered`);
      updateTooltip();
      console.error('Error in ClippyService:', error?.stack || error);
    });
  });
});
