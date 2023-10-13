import { Range } from 'types/vscode/range';
import { takeGeneratedText as reportGeneration} from 'utils/axios';

class ReactionReporter {
  private _currentCursor: Range = new Range(0, 0, 0, 0);
  private _lastCursor: Range = new Range(0, 0, 0, 0);
  private _version: string = '0.0.0';

  updateCursor(cursor: Range) {
    this._lastCursor = this._currentCursor;
    this._currentCursor = cursor;
  }

  updateVersion(version: string) {
    this._version = version;
  }

  async reportGeneration(delay: number, projectId: string) {
    if (this._lastCursor.start.line !== this._currentCursor.start.line) {
      await reportGeneration(delay, projectId, this._version);
    }
  }
}

const reactionReporter = new ReactionReporter();

export default reactionReporter;
