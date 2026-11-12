// Mock AI Provider with realistic canned Hindi responses constructed from case data

import type { AiProvider, GenerateJsonArgs, GenerateJsonResponse } from './provider';
import type {
  ScrutinyExtractOutput,
  FieldReportOutput,
  NoticePartiesOutput,
  HearingSummaryOutput,
  OrderDraftOutput,
} from './schemas';

export class MockAiProvider implements AiProvider {
  name = 'mock';

  async generateJson(args: GenerateJsonArgs): Promise<GenerateJsonResponse> {
    const startTime = Date.now();

    // Small simulated latency for realistic UI state changes (100ms)
    await new Promise((r) => setTimeout(r, 100));

    const prompt = args.user;

    // Helper regex to extract case data from prompt
    const extractField = (fieldName: string): string => {
      const match = prompt.match(new RegExp(`${fieldName}:?\\s*([^\r\n]+)`, 'i'));
      return match ? match[1].trim() : '';
    };

    const caseNo = extractField('Case Number') || 'वाद संख्या';
    const applicantName = extractField('Applicant Name') || extractField('Applicant') || 'आवेदक';
    const mauza = extractField('Mauza') || 'मौजा';
    const khataNo = extractField('Khata No') || extractField('Khata') || '123';
    const khesraNo = extractField('Khesra No') || extractField('Khesra') || '456';
    const areaRaw = extractField('Area (Decimal)') || extractField('Area') || '15';
    const areaDecimal = parseFloat(areaRaw) || 15;
    const deedNo = extractField('Deed No') || '1024/2026';
    const deedDate = extractField('Deed Date') || '2026-09-10';

    let resultObject: unknown;

    if (prompt.includes('Extract the facts. Compare them with the petition values')) {
      // 1. SCRUTINY_EXTRACT
      const output: ScrutinyExtractOutput = {
        extracted: {
          sellerName: 'रामेश्वर प्रसाद सिंह',
          buyerName: applicantName,
          khataNo: khataNo,
          khesraNo: khesraNo,
          areaDecimal: areaDecimal,
          deedNo: deedNo,
          deedDate: deedDate,
          boundaryDescription: 'उत्तर: निज क्रेता, दक्षिण: सड़क, पूरब: सोहन लाल, पश्चिम: नाला',
        },
        mismatches: [],
        missingItems: [],
        summaryHi: `दस्तावेज संख्या ${deedNo} का मिलान आवेदन के विवरण से पूर्णतः सही पाया गया। विक्रेता रामेश्वर प्रसाद सिंह द्वारा क्रेता ${applicantName} के पक्ष में ${areaDecimal} डिसमिल भूमि अंतरित की गई है।`,
      };
      resultObject = output;
    } else if (prompt.includes('Turn the rough notes into a formal field enquiry report')) {
      // 2. FIELD_REPORT
      const output: FieldReportOutput = {
        reportText: `स्थल निरीक्षण में पाया गया कि मौजा ${mauza}, खाता संख्या ${khataNo}, खेसरा संख्या ${khesraNo}, रकबा ${areaDecimal} डिसमिल भूमि पर आवेदक ${applicantName} का शांतिपूर्ण दखल-कब्जा कायम है। मौके पर सीमांकन की जांच की गई, जिसमें चौहद्दी का कोई सीमा विवाद परिलक्षित नहीं हुआ। आसपास के रैयतों एवं ग्रामीणों ने आवेदक के भौतिक कब्जे की पुष्टि की है।`,
        possessionStatus: 'BUYER',
        coSharersMentioned: ['सुरेश सिंह', 'दिनेश सिंह'],
        boundaryDispute: false,
        missingItems: [],
      };
      resultObject = output;
    } else if (prompt.includes('List the people who should receive a specific notice (Form-XII)')) {
      // 3. NOTICE_PARTIES
      const output: NoticePartiesOutput = {
        parties: [
          {
            name: 'रामेश्वर प्रसाद सिंह',
            relation: 'मूल विक्रेता',
            reasonHi: 'केवाला विलेख के अनुसार भूमि के मूल हस्तांतरणकर्ता।',
            source: 'DEED',
          },
          {
            name: 'सुरेश सिंह',
            relation: 'सह-खातेदार / हिस्सेदार',
            reasonHi: 'खतियान एवं स्थल जांच के अनुसार संबंधित खाता में संयुक्त हिस्सेदार।',
            source: 'FIELD_REPORT',
          },
          {
            name: 'सोहन लाल',
            relation: 'पूरब दिशा का सीमावर्ती रैयत',
            reasonHi: 'चौहद्दी में सीमा विवाद की संभावना की जांच हेतु।',
            source: 'DEED',
          },
        ],
        uncertainNotes: [],
      };
      resultObject = output;
    } else if (prompt.includes('Write a short summary of the file')) {
      // 4. HEARING_SUMMARY
      const output: HearingSummaryOutput = {
        summaryHi: `वाद संख्या ${caseNo} में आवेदक ${applicantName} द्वारा प्रस्तुत केवाला संख्या ${deedNo} एवं हल्का कर्मचारी के जांच प्रतिवेदन का अवलोकन किया गया। स्थल पर आवेदक का शांतिपूर्ण दखल प्रमाणित है। आम सूचना एवं खास सूचना विधिवत तामीला कराई गई। सूचना अवधि के भीतर कोई आपत्ति प्राप्त नहीं हुई है।`,
        keyRisks: [
          {
            titleHi: 'सह-हिस्सेदार का स्वामित्व',
            whyHi: 'खाते में अन्य सह-रैयत भी दर्ज हैं, हालांकि मौके पर कोई विवाद नहीं पाया गया।',
            evidence: 'हल्का कर्मचारी प्रतिवेदन एवं खतियान विवरण',
          },
        ],
        pointsFor: [
          'पंजीकृत केवाला एवं मालगुजारी रसीद संलग्न है।',
          'स्थल जांच में आवेदक का भौतिक कब्जा प्रमाणित है।',
          'निर्धारित अवधि में कोई वैध आपत्ति प्राप्त नहीं हुई।',
        ],
        pointsAgainst: [],
        draftRecommendationHi: `अतः वाद अभिलेख के आधार पर नामान्तरण वाद निष्पादन हेतु प्रस्तुत है:\n\n[विकल्प 1 - स्वीकृति हेतु]: आवेदक के पक्ष में खाता ${khataNo}, खेसरा ${khesraNo}, रकबा ${areaDecimal} डिसमिल का नामान्तरण स्वीकृत करने की स्पष्ट अनुशंसा की जाती है।\n\n[विकल्प 2 - अस्वीकृति हेतु]: यदि पूर्व लगान रसीद में कोई तकनीकी त्रुटि पाई जाती है, तो वाद अस्वीकृत किया जा सकता है।`,
      };
      resultObject = output;
    } else if (prompt.includes('Draft the final order in formal Hindi')) {
      // 5. ORDER_DRAFT
      const isReject = prompt.includes('INTENDED DECISION: REJECT');

      if (isReject) {
        const output: OrderDraftOutput = {
          orderTextHi: `कार्यालय अंचलाधिकारी।\nवाद संख्या: ${caseNo}\nआवेदक: ${applicantName}\nमौजा: ${mauza}, खाता: ${khataNo}, खेसरा: ${khesraNo}, रकबा: ${areaDecimal} डिसमिल।\n\nअभिलेख एवं साक्ष्यों के परिशीलन से स्पष्ट है कि आवेदित भूमि के संबंध में वैधानिक त्रुटियाँ पाई गई हैं तथा आवेदक द्वारा स्वामित्व का संतोषप्रद साक्ष्य प्रस्तुत नहीं किया गया।\n\nअतः बिहार भूमि दाखिल-खारिज अधिनियम 2011 के प्रावधानों के अंतर्गत उक्त नामान्तरण वाद अस्वीकृत (REJECT) किया जाता है। आदेश की प्रति आवेदक को प्रेषित की जाए।`,
          missingFacts: [],
        };
        resultObject = output;
      } else {
        const output: OrderDraftOutput = {
          orderTextHi: `कार्यालय अंचलाधिकारी।\nवाद संख्या: ${caseNo}\nआवेदक: ${applicantName}\nमौजा: ${mauza}, खाता: ${khataNo}, खेसरा: ${khesraNo}, रकबा: ${areaDecimal} डिसमिल।\n\nराजस्व अधिकारी एवं हल्का कर्मचारी के स्थल जांच प्रतिवेदन का अवलोकन किया गया। आम एवं खास सूचना का निर्गमन नियमानुसार हुआ। कोई आपत्ति प्राप्त नहीं हुई। आवेदक का शांतिपूर्ण भौतिक दखल-कब्जा एवं स्वामित्व संपुष्ट है।\n\nअतः बिहार भूमि दाखिल-खारिज अधिनियम 2011 के अंतर्गत यह आवेदन स्वीकृत (APPROVE) किया जाता है। राजस्व कर्मचारी को आदेश दिया जाता है कि पूर्व जमाबंदी से रकबा घटाकर क्रेता ${applicantName} के नाम से नई जमाबंदी कायम करें एवं नियमानुसार शुद्धि पत्र (Correction Slip) निर्गत करें।`,
          missingFacts: [],
        };
        resultObject = output;
      }
    } else {
      // Fallback generic json
      resultObject = {
        summaryHi: `वाद संख्या ${caseNo} का विश्लेषण संपन्न हुआ।`,
      };
    }

    const latencyMs = Date.now() - startTime;
    return {
      text: JSON.stringify(resultObject),
      model: 'mock-engine-v1',
      latencyMs,
    };
  }
}
