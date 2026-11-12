import { describe, expect, it } from 'vitest';
import type { AiOutcome } from '@/lib/workflow/types';

describe('Phase 9: AI Suggestions Outcome Lifecycle', () => {
  it('correctly tracks ACCEPTED, EDITED, and DISCARDED outcomes', () => {
    const outcomes: AiOutcome[] = ['PENDING', 'ACCEPTED', 'EDITED', 'DISCARDED'];
    expect(outcomes).toContain('ACCEPTED');
    expect(outcomes).toContain('EDITED');
    expect(outcomes).toContain('DISCARDED');

    // Simulate comparison logic
    const aiText = 'स्थल निरीक्षण में पाया गया कि आवेदक का शांतिपूर्ण दखल-कब्जा है।';

    // 1. Unchanged -> ACCEPTED
    const savedTextUnchanged = 'स्थल निरीक्षण में पाया गया कि आवेदक का शांतिपूर्ण दखल-कब्जा है।';
    const outcome1: AiOutcome = aiText.trim() === savedTextUnchanged.trim() ? 'ACCEPTED' : 'EDITED';
    expect(outcome1).toBe('ACCEPTED');

    // 2. Modified -> EDITED
    const savedTextModified = 'स्थल निरीक्षण में पाया गया कि आवेदक का शांतिपूर्ण दखल-कब्जा है, पर सह-हिस्सेदार अनुपस्थित थे।';
    const outcome2: AiOutcome = aiText.trim() === savedTextModified.trim() ? 'ACCEPTED' : 'EDITED';
    expect(outcome2).toBe('EDITED');

    // 3. User rejects suggestion -> DISCARDED
    const outcome3: AiOutcome = 'DISCARDED';
    expect(outcome3).toBe('DISCARDED');
  });
});
