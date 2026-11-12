import { describe, expect, it } from 'vitest';
import { MockAiProvider } from './mockProvider';
import {
  TASK_SCHEMAS,
  type AiTaskKind,
} from './schemas';
import { cleanJsonText, runAiTask } from './service';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts';
import type { ApplicationRow } from '@/lib/repo/applications';

const sampleApp: ApplicationRow = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  case_no: 'MUT-2026-0042',
  applicant_name: 'मनोज कुमार',
  applicant_phone: '9876543210',
  transaction_type: 'SALE',
  mauza: 'रामपुर',
  khata_no: '45',
  khesra_no: '112',
  area_decimal: 12.5,
  deed_no: '882/2026',
  deed_date: '2026-08-15',
  deed_text: 'बिक्री विलेख संख्या 882/2026। विक्रेता: रामेश्वर सिंह, क्रेता: मनोज कुमार, खाता 45, खेसरा 112, रकबा 12.5 डिसमिल।',
  received_on: '2026-09-01',
  due_on: '2026-10-15',
  current_step: 'SCRUTINY',
  status: 'IN_PROGRESS',
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
};

describe('Phase 8: AI Backend Layer', () => {
  const provider = new MockAiProvider();

  const taskKinds: AiTaskKind[] = [
    'SCRUTINY_EXTRACT',
    'FIELD_REPORT',
    'NOTICE_PARTIES',
    'HEARING_SUMMARY',
    'ORDER_DRAFT',
  ];

  it.each(taskKinds)(
    'Mock provider returns valid JSON conforming to Zod schema for %s',
    async (kind) => {
      const userPrompt = buildUserPrompt(kind, sampleApp, {
        roughNotes: 'दखल मनोज कुमार का है। कोई विवाद नहीं।',
        reportText: 'स्थल निरीक्षण में पाया गया कि आवेदक का कब्जा है।',
        recommendationText: 'दाखिल-खारिज स्वीकृत करने की अनुशंसा।',
      });

      const res = await provider.generateJson({
        system: SYSTEM_PROMPT,
        user: userPrompt,
        timeoutMs: 5000,
      });

      expect(res.text).toBeDefined();
      expect(res.model).toBe('mock-engine-v1');
      expect(res.latencyMs).toBeGreaterThan(0);

      const parsed = JSON.parse(res.text);
      const schema = TASK_SCHEMAS[kind];
      const validated = schema.safeParse(parsed);

      expect(validated.success).toBe(true);
    }
  );

  it('generates valid ORDER_DRAFT for both APPROVE and REJECT decisions', async () => {
    // 1. APPROVE
    const approvePrompt = buildUserPrompt(
      'ORDER_DRAFT',
      sampleApp,
      { recommendationText: 'स्वीकृति की अनुशंसा' },
      { intendedDecision: 'APPROVE' }
    );
    const approveRes = await provider.generateJson({
      system: SYSTEM_PROMPT,
      user: approvePrompt,
      timeoutMs: 5000,
    });
    const approveParsed = JSON.parse(approveRes.text);
    expect(TASK_SCHEMAS.ORDER_DRAFT.safeParse(approveParsed).success).toBe(true);
    expect(approveParsed.orderTextHi).toContain('स्वीकृत');

    // 2. REJECT
    const rejectPrompt = buildUserPrompt(
      'ORDER_DRAFT',
      sampleApp,
      { recommendationText: 'अस्वीकृति' },
      { intendedDecision: 'REJECT' }
    );
    const rejectRes = await provider.generateJson({
      system: SYSTEM_PROMPT,
      user: rejectPrompt,
      timeoutMs: 5000,
    });
    const rejectParsed = JSON.parse(rejectRes.text);
    expect(TASK_SCHEMAS.ORDER_DRAFT.safeParse(rejectParsed).success).toBe(true);
    expect(rejectParsed.orderTextHi).toContain('अस्वीकृत');
  });

  it('cleanJsonText strips markdown fences accurately', () => {
    const rawFenced = '```json\n{"summaryHi": "परीक्षण"}\n```';
    expect(cleanJsonText(rawFenced)).toBe('{"summaryHi": "परीक्षण"}');

    const rawSimpleFenced = '```\n{"key": 1}\n```';
    expect(cleanJsonText(rawSimpleFenced)).toBe('{"key": 1}');

    const bareJson = '{"foo": "bar"}';
    expect(cleanJsonText(bareJson)).toBe('{"foo": "bar"}');
  });

  it('runAiTask validates and returns output without mutating application state', async () => {
    // Clone original application to verify zero state mutations
    const appCopy = { ...sampleApp };

    const result = await runAiTask(
      'SCRUTINY_EXTRACT',
      appCopy,
      {},
      '00000000-0000-0000-0000-000000000000',
      { skipDb: true }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBeDefined();
      expect(result.model).toBe('mock-engine-v1');
    }

    // Verify application status and current step were never changed
    expect(appCopy.status).toBe(sampleApp.status);
    expect(appCopy.current_step).toBe(sampleApp.current_step);
    expect(appCopy.id).toBe(sampleApp.id);
  });
});
