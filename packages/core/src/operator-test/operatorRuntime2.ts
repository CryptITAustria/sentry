import { ethers } from 'ethers';
import { SubgraphFacade } from './services/SubgraphFacade.js';
import { ChallengeProcessor } from './processors/ChallengeProcessor.js';
import { ChallengeListener } from './listeners/ChallengeListener.js';
import { config, PublicNodeBucketInformation } from '../index.js';
import { Challenge } from '@sentry/sentry-subgraph-client';

export class OperatorRuntime2 {
  private subgraphFacade: SubgraphFacade;
  private challengeProcessor: ChallengeProcessor;
  private challengeListener: ChallengeListener;
  private signer: ethers.Signer;
  private logFunction?: (log: string) => void;
  private onAssertionMissMatch: (publicNodeData: PublicNodeBucketInformation | undefined, challenge: Challenge, message: string) => void;

  constructor(
    signer: ethers.Signer,
    onAssertionMissMatch: (publicNodeData: PublicNodeBucketInformation | undefined, challenge: Challenge, message: string) => void,
    logFunction?: (log: string) => void
  ) {
    const provider = signer.provider as ethers.Provider;
    const subgraphEndpoint = config.subgraphEndpoint;
    this.subgraphFacade = new SubgraphFacade(subgraphEndpoint, provider, logFunction);
  
    this.signer = signer;   
    this.logFunction = logFunction;
    this.onAssertionMissMatch = onAssertionMissMatch;
    this.challengeProcessor = new ChallengeProcessor(this.signer, this.subgraphFacade, this.onAssertionMissMatch.bind(this), logFunction);
    this.challengeListener = new ChallengeListener(this.subgraphFacade, this.challengeProcessor, logFunction);
  }
  

  async initialize(): Promise<void> {
    this.log("info", `Booting operator runtime.`);
    const operatorAddress = await this.signer.getAddress();
    this.log("info",`Fetched address of operator ${operatorAddress}.`);
  
    await this.start();
  }

  async start(): Promise<() => Promise<void>> {
    this.log("info", 'Starting OperatorRuntime');
    
    await this.challengeListener.start();
    
    // Return a function that can be called to stop the runtime
    return async () => {
      this.log("info", 'Stopping OperatorRuntime');
      this.challengeListener.stop();
    };
  }

  
  private log(level: 'info' | 'warn' | 'error', message: string): void {
    if (this.logFunction) {
      switch (level) {
        case 'info':
          this.logFunction(`[ChallengeListener] [Info] ${message}`);
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
