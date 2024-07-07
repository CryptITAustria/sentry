import { SubgraphFacade } from '../services/SubgraphFacade.js';
import { Challenge } from '@sentry/sentry-subgraph-client';
import { ChallengeProcessor } from '../processors/ChallengeProcessor.js';

/**
 * Listener for challenge events.
 * This class periodically checks for new challenges and processes them.
 */
export class ChallengeListener {
  private subgraphFacade: SubgraphFacade;
  private isListening: boolean = false;
  private pollInterval: number = 60000; // 1 minute in milliseconds
  private intervalId: NodeJS.Timeout | null = null;
  private challengeProcessor: ChallengeProcessor;
  private logFunction?: (log: string) => void;

  /**
   * Constructor for ChallengeListener.
   * @param {SubgraphFacade} subgraphFacade - The facade service to interact with the subgraph.
   * @param {ChallengeProcessor} challengeProcessor - The processor to handle new challenges.
   * @param {(log: string) => void} [logFunction] - Optional logging function to log messages.
   */
  constructor(subgraphFacade: SubgraphFacade, challengeProcessor: ChallengeProcessor, logFunction?: (log: string) => void) {
    this.subgraphFacade = subgraphFacade;
    this.challengeProcessor = challengeProcessor;
    this.logFunction = logFunction;
  }

  /**
   * Starts the challenge listener.
   * This method sets up periodic polling to check for new challenges.
   * @returns {Promise<void>}
   */
  async start(): Promise<void> {
    if (this.isListening) {
      this.log('warn', 'ChallengeListener is already running');
      return;
    }

    this.isListening = true;
    this.log('info', 'Starting ChallengeListener');

    let lastProcessedChallengeNumber: bigint | null = null;

    const checkForNewChallenges = async () => {
      try {
        // Fetch the latest challenge from the subgraph
        const latestChallenge = await this.subgraphFacade.getLatestChallenge();

        // Process the new challenge if it is newer than the last processed challenge
        if (lastProcessedChallengeNumber === null || latestChallenge.challengeNumber > lastProcessedChallengeNumber) {
          this.log('info', `New challenge detected: ${latestChallenge.challengeNumber}`);
          await this.challengeProcessor.processNewChallenge(latestChallenge);
          lastProcessedChallengeNumber = latestChallenge.challengeNumber;
        }
      } catch (error) {
        this.log('error', `Error checking for new challenges: ${error}`);
      }
    };

    // Perform initial check
    await checkForNewChallenges();

    // Set up periodic polling
    this.intervalId = setInterval(checkForNewChallenges, this.pollInterval);
  }

  /**
   * Stops the challenge listener.
   * This method clears the polling interval and stops checking for new challenges.
   */
  stop(): void {
    if (!this.isListening) {
      this.log('warn', 'ChallengeListener is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isListening = false;
    this.log('info', 'Stopped ChallengeListener');
  }

  /**
   * Logs a message using the provided log function.
   * @param {'info' | 'warn' | 'error'} level - The log level (info, warn, error).
   * @param {string} message - The message to log.
   */
  private log(level: 'info' | 'warn' | 'error', message: string): void {
    if (this.logFunction) {
      switch (level) {
        case 'info':
          this.logFunction(`[ChallengeListener] [INFO] ${message}`);
          break;
        case 'warn':
          this.logFunction(`[ChallengeListener] [WARN] ${message}`);
          break;
        case 'error':
          this.logFunction(`[ChallengeListener] [ERROR] ${message}`);
          break;
      }
    }
  }
}
