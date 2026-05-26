const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_SUMMARY_MODEL = "claude-3-5-haiku-20241022";
const MAX_HISTORY_MESSAGES = 14;
const SUMMARY_TRIGGER_MESSAGES = 14;
const SUMMARY_RECENT_MESSAGES = 6;
const RAG_RECENT_MESSAGES = 8;
const DEFAULT_HUMAN_TAKEOVER_TTL_MINUTES = 5;
const BOT_ECHO_METADATA = "mali_bot_reply";
const AHACHAT_COURSE_QUESTION =
  "À bên mình có tổ chức khoá KHƠI THÔNG DÒNG TIỀN hoàn toàn Miễn Phí giúp mọi người kết nối sâu với năng lượng tiền bạc. Bạn đã tham gia rồi chứ";
const MEDITATION_FILE_BLOCK =
  "Gửi bạn file thực hành thiền kết nối với tiền nhé!!\n1. THIỀN HÚT TIỀN VỀ TRONG 7 NGÀY\nhttps://youtu.be/HL_cWTS2Ay8?si=r5iZTaeCLspOxDzX\n\n2. Thiền Thu Hút Mục Tiêu Siêu Tốc\nhttps://www.youtube.com/watch?v=7MFMY9NG3FY&t=16s";
const MEDITATION_FILE_NOTE =
  "Lưu ý: Làm vào thời điểm buổi sáng từ 4h-6h30 trong 1 tuần liên tục để đạt hiệu quả cao nhất";
const CLAUDE_SYSTEM_PROMPT = `Bạn là Thầy Mong, đang nhắn trực tiếp với học viên tiềm năng qua Messenger. Không nói mình là bot, trợ lý hay AI.

Xưng hô: Luôn xưng "mình". Mặc định gọi khách là "bạn"; nếu khách tự xưng "em" thì có thể gọi khách là "em". Nếu khách chưa xưng rõ thì tránh gọi danh xưng khi không cần. Không bao giờ dùng "tôi" hay "tớ". Không tự xưng "e/em". Tuyệt đối không dùng danh xưng theo giới tính để gọi khách.

Phong cách: Nhắn như người thật, ấm, gọn, có ngữ cảnh. Độ dài theo đúng tình huống, không ép câu quá ngắn. Dùng [NEXT] khi tách nhịp tự nhiên. Không emoji, không bullet, không in đậm. Không hỏi nếu chưa thật sự cần.

Mục tiêu: không chỉ hỏi. Hãy tư vấn theo nhịp: lắng nghe -> chẩn đoán -> gỡ góc nhìn -> chốt mềm khóa Khơi Thông Dòng Tiền khi đủ tín hiệu.

Luật chống hỏi nhiều:
- Không hỏi quá 1 lượt liên tiếp.
- Nếu đã biết vấn đề chính và thời gian/hoàn cảnh, dừng hỏi và chuyển sang chẩn đoán.
- Nếu khách nói bế tắc, nợ, kẹt dòng tiền, tụt doanh thu, lo lắng, sợ tiền hoặc xác nhận "đúng/có", không hỏi vòng nữa.
- Không hỏi kiểu xoáy như "có phải tiền cứ trốn mình không?".
- Không phản biện khách kiểu "nhiều người cùng hoàn cảnh mà kết quả khác nhau".
- Không làm khách thấy bị sai, bị dạy đời, bị chất vấn.
- Khi khách trả lời ngắn, hãy phản chiếu và đưa insight ngắn, không hỏi tiếp ngay.
- Nếu khách chỉ nói chung chung như "gặp vấn đề", "khó khăn quá", "vấn đề về tiền" mà chưa nói rõ là nợ, thu nhập, chi tiêu, doanh thu, động lực hay cảm xúc, hãy hỏi 1 câu: "Cụ thể bạn đang gặp vấn đề gì vậy?"

Chẩn đoán ngắn theo vấn đề:
- Nợ/kẹt tiền: nỗi sợ và áp lực làm mình càng co lại, quyết định tiền bạc dễ rối.
- Ít khách/doanh thu tụt: năng lượng thiếu tin và cần tiền gấp khiến cách bán hàng bị nặng.
- Trì hoãn/không dám làm: thường là niềm tin tiền bạc sai và sợ thất bại đang kéo lại.
- Lo lắng/tiêu cực: cảm xúc thấp làm dòng chảy tài chính bị nghẽn.

Khi chẩn đoán: phản chiếu đúng vấn đề khách, nói 1 insight ngắn, rồi dừng hoặc chốt mềm. Đừng hứa chữa khỏi, giàu lên, hết nợ hay đổi đời. Không dùng giọng thách thức.

Khi chốt: Chỉ hỏi "Bạn đăng ký khóa Khơi Thông Dòng Tiền rồi chưa?" sau khi đã phản hồi vấn đề của khách ít nhất 2 nhịp hoặc khách hỏi cách tham gia/link. Nếu khách vừa chia sẻ nợ nặng, phá sản, mất việc, bế tắc hoặc áp lực gia đình, tuyệt đối chưa chốt ngay; hãy đồng cảm, phản chiếu, gỡ 1 góc nhìn và có thể gợi ý nhắn trợ lý nếu cần tư vấn sâu.

Nếu đã đăng ký hoặc đã học rồi: "Ừm tốt rồi em[NEXT]Em để ý thông báo trong nhóm để vào buổi học đúng giờ nhé" rồi dừng, không hỏi thêm.

Cần tư vấn sâu hơn: "Bạn nhắn trợ lý mình nha, sdt 0355 067 656"

Nếu khách hỏi về khóa Luật Hấp Dẫn chuyên sâu: không giới thiệu nội dung khóa chuyên sâu. Hãy khuyên khách học Khơi Thông Dòng Tiền trước. Nếu khách nói cần tư vấn học sâu luôn, xin số điện thoại để bên mình tư vấn.

Không được bịa đặt thông tin về Thầy Mong. Chỉ dùng đúng 2 ý khi cần kể chuyện: hơn chục năm trước thầy bị lừa mất hết tiền, vướng nợ, thất nghiệp; thầy thay đổi nhờ hiểu đúng Luật Hấp Dẫn và Nhân Quả, giờ tài chính vững vàng.`;

const CLAUDE_RUNTIME_GUARDRAILS = `Bo nho va trang thai:
- Hieu "co/dung/vang/da" theo dung cau hoi gan nhat cua assistant.
- Neu cau hoi gan nhat la ve cam xuc, dong luc, chi tieu hoac tien bac, "co" chi xac nhan van de, khong co nghia la da dang ky hoac da hoc.
- Khi chua ro trang thai dang ky va can hoi "da dang ky khoa Khoi Thong Dong Tien chua?", chi hoi cau do roi dung.
- Khong tu tra loi thay khach bang "Tuyet voi qua" hoac hen gap neu khach chua xac nhan da dang ky/da hoc.
- Luon tra loi dung y khach vua noi truoc; neu khach noi ve nhom kin, lich live, buoi hoc, ngay mai, trua/toi thi xac nhan lich va nhac vao hoc, khong keo ve cau hoi tai chinh ngay.
- Neu khach da vao nhom hoac biet lich hoc, dung hoi "co van de gi voi tien bac khong"; hay noi tu nhien nhu nguoi truc inbox.
- Neu khach noi "da/da em/vang em" roi hoi them ve hoc phi, dat coc, khoa tai chinh, lich hoc, hoac tu van thi phai tra loi cau hoi do; khong duoc xem la da dang ky xong.
- Khong hoi dang ky khoa ngay sau tin dau tien khach vua ke no nang, pha san, be tac. Toi thieu can them 1-2 nhip dong cam/tu van truoc.`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname !== "/webhook" && url.pathname !== "/") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET") {
      return verifyWebhook(url, env);
    }

    if (request.method === "POST") {
      let payload;

      try {
        payload = await request.clone().json();
      } catch (error) {
        console.error("Invalid webhook JSON", error);
        return new Response("OK", { status: 200 });
      }

      ctx.waitUntil(handleWebhook(payload, env));
      return new Response("OK", { status: 200 });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, POST" },
    });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runRemarketing(env));
  },
};

function verifyWebhook(url, env) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

async function handleWebhook(payload, env) {
  if (payload.object !== "page" || !Array.isArray(payload.entry)) {
    return;
  }

  for (const entry of payload.entry) {
    const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];

    for (const event of messagingEvents) {
      if (event.message?.is_echo) {
        await handlePageEcho(event, env);
        continue;
      }

      if (event.postback?.payload === "GET_STARTED" && event.sender?.id) {
        continue;
      }

      if (!event.sender?.id) {
        continue;
      }

      if (isGiveawayTriggerEvent(event)) {
        continue;
      }

      if (isAhachatConsentEvent(event)) {
        await markAhachatWaiting(event.sender.id, env);
        continue;
      }

      if (event.message?.text) {
        await handleMessage(event.sender.id, event.message.text, env);
      } else if (event.optin) {
        await markAhachatWaiting(event.sender.id, env);
        continue;
      } else if (event.postback) {
        await handleMessage(
          event.sender.id,
          event.postback.title || event.postback.payload,
          env,
        );
      }
    }
  }
}

function isAhachatConsentEvent(event) {
  if (event.optin) {
    return true;
  }

  const texts = [
    event.message?.text,
    event.postback?.title,
    event.postback?.payload,
    event.referral?.ref,
  ]
    .filter((text) => typeof text === "string")
    .map(normalizeVietnameseText);

  return texts.some(isAhachatConsentReply);
}

function isGiveawayTriggerEvent(event) {
  const texts = [
    event.message?.text,
    event.postback?.title,
    event.postback?.payload,
    event.referral?.ref,
  ]
    .filter((text) => typeof text === "string")
    .map(normalizeVietnameseText);

  return texts.some(isGiveawayTriggerText);
}

async function markAhachatWaiting(senderId, env) {
  const chatState = await getChatState(senderId, env);
  await saveChatState(senderId, getAhachatWaitingState(chatState), env);
}

async function markHumanTakeover(senderId, env, pageText = "") {
  const chatState = await getChatState(senderId, env);
  const messages = chatState.messages;

  if (pageText) {
    messages.push({
      role: "assistant",
      content: pageText,
    });
  }

  await saveChatState(
    senderId,
    {
      ...chatState,
      messages: messages.slice(-MAX_HISTORY_MESSAGES),
      humanTakeoverUntil: getHumanTakeoverUntil(env),
    },
    env,
  );
}

async function saveUserMessageDuringHumanTakeover(senderId, userText, chatState, env) {
  const messages = chatState.messages;
  const isFirstMessage =
    !chatState.firstMessage && !messages.some((message) => message.role === "user");

  if (isFirstMessage) {
    await saveToSheet(senderId, userText);
  }

  messages.push({
    role: "user",
    content: userText,
  });

  await saveChatState(
    senderId,
    {
      ...chatState,
      messages: messages.slice(-MAX_HISTORY_MESSAGES),
      lastSeen: new Date().toISOString(),
      firstMessage: chatState.firstMessage || userText,
    },
    env,
  );
}

async function handleMessage(senderId, userText, env) {
  try {
    const chatState = await getChatState(senderId, env);
    let messages = chatState.messages;
    const normalizedText = normalizeVietnameseText(userText);
    const ahachatCourseAnswer = shouldHandleAhachatCourseAnswer(normalizedText, chatState);

    if (isHumanTakeoverActive(chatState)) {
      await saveUserMessageDuringHumanTakeover(senderId, userText, chatState, env);
      return;
    }

    if (isGiveawayTriggerText(normalizedText)) {
      return;
    }

    if (isAutomationStartMessage(normalizedText)) {
      return;
    }

    if (shouldIgnoreAhachatUserMessage(normalizedText, chatState)) {
      await saveChatState(senderId, getAhachatWaitingState(chatState), env);
      return;
    }

    if (
      ahachatCourseAnswer &&
      !isRegistrationQuestion(getLastAssistantMessage(messages)?.content || "")
    ) {
      messages.push({
        role: "assistant",
        content: AHACHAT_COURSE_QUESTION,
      });
    }

    const isFirstMessage =
      !chatState.firstMessage && !messages.some((message) => message.role === "user");

    if (isFirstMessage) {
      await saveToSheet(senderId, userText);
    }

    messages.push({
      role: "user",
      content: userText,
    });

    let customerProfile = updateCustomerProfile(
      userText,
      chatState.customerProfile,
      messages,
    );

    if (ahachatCourseAnswer) {
      const isRegistered = !hasNegativeResponse(normalizedText);
      customerProfile = {
        ...customerProfile,
        registered: isRegistered,
        nextStep: isRegistered
          ? "Hẹn khách ở buổi học tiếp theo"
          : "Gửi link đăng ký khóa Khơi Thông Dòng Tiền",
      };
    }

    if (isMeditationFileRequest(normalizedText)) {
      messages.push({
        role: "assistant",
        content: `${MEDITATION_FILE_BLOCK}[NEXT]${MEDITATION_FILE_NOTE}[NEXT]${AHACHAT_COURSE_QUESTION}`,
      });
      messages = messages.slice(-MAX_HISTORY_MESSAGES);

      await saveChatState(
        senderId,
        {
          messages,
          lastSeen: new Date().toISOString(),
          status: "interested",
          firstMessage: chatState.firstMessage || userText,
          customerProfile,
          ahachatGate: "ready_for_course_answer",
          ahachatGateAt: new Date().toISOString(),
        },
        env,
      );

      await sendMeditationFileFlow(senderId, env);
      return;
    }

    const ruleBasedAnswer = getRuleBasedAnswer(userText, messages);

    if (ruleBasedAnswer) {
      messages.push({
        role: "assistant",
        content: ruleBasedAnswer,
      });
      messages = messages.slice(-MAX_HISTORY_MESSAGES);

      const updatedState = {
        messages,
        lastSeen: new Date().toISOString(),
        status: getAhachatAnswerStatus(normalizedText, ahachatCourseAnswer) || getUpdatedStatus(userText, chatState.status),
        firstMessage: chatState.firstMessage || userText,
        customerProfile,
        ahachatGate: ahachatCourseAnswer || isHumanFollowupMessage(normalizedText) ? null : chatState.ahachatGate,
        ahachatGateAt:
          ahachatCourseAnswer || isHumanFollowupMessage(normalizedText) ? null : chatState.ahachatGateAt,
      };

      await saveChatState(senderId, updatedState, env);

      await sendMessengerParts(senderId, ruleBasedAnswer, env);
      return;
    }

    if (messages.length >= SUMMARY_TRIGGER_MESSAGES) {
      messages = await summarizeMessages(messages, env);
    }

    messages = messages.slice(-MAX_HISTORY_MESSAGES);
    const answer = await askClaude(messages, env, userText, customerProfile);

    messages.push({
      role: "assistant",
      content: answer,
    });
    messages = messages.slice(-MAX_HISTORY_MESSAGES);

    const updatedState = {
      messages,
      lastSeen: new Date().toISOString(),
      status: getAhachatAnswerStatus(normalizedText, ahachatCourseAnswer) || getUpdatedStatus(userText, chatState.status),
      firstMessage: chatState.firstMessage || userText,
      customerProfile,
      ahachatGate: ahachatCourseAnswer || isHumanFollowupMessage(normalizedText) ? null : chatState.ahachatGate,
      ahachatGateAt:
        ahachatCourseAnswer || isHumanFollowupMessage(normalizedText) ? null : chatState.ahachatGateAt,
    };

    await saveChatState(senderId, updatedState, env);

    await sendMessengerParts(senderId, answer, env);
  } catch (error) {
    console.error("Failed to reply message", error);
    await sendMessengerText(
      senderId,
      "Hiện tại thầy chưa phản hồi được ngay. Bạn vui lòng nhắn lại sau ít phút nhé.",
      env,
    );
  }
}

function getRuleBasedAnswer(userText, messages = []) {
  const normalizedText = normalizeVietnameseText(userText);
  const greetings = ["chao", "chao ban", "xin chao", "chao thay", "xin chao thay", "hello", "hi"];

  if (isGiftScriptRequest(normalizedText) || isMoneyGratitudeRequest(normalizedText)) {
    return getGiftScriptKeywordAnswer();
  }

  if (isMoneyGratitudeNotSeen(normalizedText, messages)) {
    return getGiftScriptKeywordAnswer();
  }

  if (isMoneyGratitudeSmallTalk(normalizedText, messages)) {
    return getGiftScriptKeywordAnswer();
  }

  if (greetings.includes(normalizedText)) {
    return "Chào bạn, mình có thể giúp gì cho bạn?";
  }

  if (isGroupOrScheduleConfirmation(normalizedText)) {
    return "Đúng rồi em, mai có buổi chia sẻ buổi trưa đó[NEXT]Em để ý thông báo trong nhóm để vào đúng giờ nhé";
  }

  if (isHeavyDebtDisclosure(normalizedText)) {
    return "Mình nghe em nói vậy thấy áp lực này rất nặng, nhất là khi nợ nhiều phía cùng dồn lại[NEXT]Lúc này mình đừng vội quyết gì lớn, trước hết cần bình tâm để nhìn lại từng khoản và hướng đi mới";
  }

  if (isAdvancedCourseConsultRequest(normalizedText)) {
    return "Bạn để lại sdt nhé[NEXT]Bên mình sẽ tư vấn kỹ hơn cho bạn";
  }

  if (isAdvancedCourseQuestion(normalizedText)) {
    return "Mình khuyên bạn học Khơi Thông Dòng Tiền trước nhé[NEXT]Khóa này giúp mình nhìn rõ điểm tắc với tiền";
  }

  if (isGenericProblemStatement(normalizedText)) {
    return "Mình hiểu rồi[NEXT]Cụ thể bạn đang gặp vấn đề gì vậy?";
  }

  if (isDebtFamilyPressureStatement(normalizedText)) {
    return "Thế này chắc em áp lực lắm đúng không, khi nợ và chuyện gia đình dồn lại thế này[NEXT]Thế em đã có cách nào xử lý vấn đề trên chưa?";
  }

  if (isCourseOverviewQuestion(normalizedText)) {
    return "Bên mình có khóa Khơi Thông Dòng Tiền miễn phí. Khóa giúp mình nhìn rõ điểm tắc với tiền[NEXT]Bạn đang gặp vấn đề gì cần mình hỗ trợ không?";
  }

  if (
    normalizedText.includes("co ai") &&
    (normalizedText.includes("online") || normalizedText.includes("chat"))
  ) {
    return "Mình đây, đang cần mình hỗ trợ gì về tài chính không?";
  }

  if (
    normalizedText.includes("quang cao") ||
    normalizedText.includes("tim hieu them") ||
    normalizedText.includes("them ve") ||
    normalizedText.includes("noi ro hon")
  ) {
    return "Đây là khóa Khơi Thông Dòng Tiền miễn phí 4 buổi[NEXT]Khóa giúp mình nhìn lại niềm tin, cảm xúc và năng lượng đang làm tiền bị tắc";
  }

  const lastAssistantMessage = getLastAssistantMessage(messages);

  if (isPaidCoursePaymentQuestion(normalizedText)) {
    return "Vụ học phí 3tr5 và đặt cọc, để trợ lý bên mình kiểm tra đúng chính sách cho em nhé[NEXT]Em để lại số điện thoại, bên mình gọi tư vấn kỹ hơn cho em";
  }

  if (isUnregisteredCourseResponse(normalizedText, lastAssistantMessage?.content || "")) {
    return "Thế bạn kích link sau đăng ký nhé[NEXT]Đây là link nha: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien-thuonghieu[NEXT]Kích vào link đăng ký luôn nhé";
  }

  if (isSimpleRegistrationAffirmative(normalizedText)) {
    if (lastAssistantMessage && isRegistrationQuestion(lastAssistantMessage.content)) {
      return "Ừm tốt rồi em[NEXT]Em để ý thông báo trong nhóm để vào buổi học đúng giờ nhé";
    }
  }

  if (
    ["roi", "roi a", "co roi", "da roi", "em roi", "minh roi", "toi roi"].includes(
      normalizedText,
    )
  ) {
    const lastAssistantMessage = getLastAssistantMessage(messages);

    if (lastAssistantMessage && isRegistrationQuestion(lastAssistantMessage.content)) {
      return "Ừm tốt rồi em[NEXT]Em để ý thông báo trong nhóm để vào buổi học đúng giờ nhé";
    }
  }

  if (
    isRegisteredCourseResponse(normalizedText)
  ) {
    return "Ừm tốt rồi em[NEXT]Em để ý thông báo trong nhóm để vào buổi học đúng giờ nhé";
  }

  if (
    normalizedText.includes("xin link") ||
    normalizedText.includes("gui link") ||
    normalizedText.includes("cho em link") ||
    normalizedText.includes("link dang ky") ||
    normalizedText.includes("dang ky o dau") ||
    normalizedText.includes("muon dang ky")
  ) {
    return "Thế bạn kích link sau đăng ký nhé[NEXT]Đây là link nha: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien-thuonghieu[NEXT]Kích vào link đăng ký luôn nhé";
  }

  if (
    normalizedText.includes("so dien thoai") ||
    normalizedText.includes("sdt") ||
    normalizedText.includes("tro ly") ||
    normalizedText.includes("tu van sau")
  ) {
    return "Bạn nhắn trợ lý mình nha, sdt 0355 067 656";
  }

  if (isThanksResponse(normalizedText)) {
    return getThanksReply(messages);
  }

  const exactAcknowledgements = ["vang", "da", "ok"];
  const flexibleAcknowledgements = ["oke", "okie"];

  if (
    exactAcknowledgements.includes(normalizedText) ||
    flexibleAcknowledgements.some(
      (acknowledgement) =>
        normalizedText === acknowledgement || normalizedText.startsWith(`${acknowledgement} `),
    )
  ) {
    return "Ừm em nhé";
  }

  return null;
}

function isAdvancedCourseConsultRequest(normalizedText) {
  const wantsAdvanced =
    normalizedText.includes("chuyen sau") ||
    normalizedText.includes("hoc sau") ||
    normalizedText.includes("hoc chuyen sau") ||
    normalizedText.includes("khoa chuyen sau") ||
    normalizedText.includes("luat hap dan chuyen sau");

  const wantsConsult =
    normalizedText.includes("tu van") ||
    normalizedText.includes("can hoc") ||
    normalizedText.includes("muon hoc") ||
    normalizedText.includes("hoc luon") ||
    normalizedText.includes("vao luon") ||
    normalizedText.includes("dang ky luon");

  return wantsAdvanced && wantsConsult;
}

function isPaidCoursePaymentQuestion(normalizedText) {
  const mentionsPaidCourse =
    normalizedText.includes("tai chinh") ||
    normalizedText.includes("3tr5") ||
    normalizedText.includes("3 tr5") ||
    normalizedText.includes("3500") ||
    normalizedText.includes("hoc phi") ||
    normalizedText.includes("khoa phi") ||
    normalizedText.includes("hoc hien tai") ||
    normalizedText.includes("hoc 4 buoi") ||
    normalizedText.includes("zoom");

  const asksPayment =
    normalizedText.includes("dat coc") ||
    normalizedText.includes("coc truoc") ||
    normalizedText.includes("mot khoan") ||
    normalizedText.includes("chuyen khoan") ||
    normalizedText.includes("tra truoc") ||
    normalizedText.includes("duoc khong") ||
    normalizedText.includes("duoc ko") ||
    normalizedText.includes("hoi thay");

  return mentionsPaidCourse && asksPayment;
}

function isSimpleRegistrationAffirmative(normalizedText) {
  const simpleAnswers = [
    "co",
    "co a",
    "co ak",
    "co roi",
    "da",
    "da a",
    "da ak",
    "vang",
    "vang a",
    "vang ak",
    "roi",
    "roi a",
    "roi ak",
    "da roi",
    "dang ky roi",
    "tham gia roi",
    "hoc roi",
  ];

  return simpleAnswers.includes(normalizedText);
}

function isGroupOrScheduleConfirmation(normalizedText) {
  const confirmsJoined =
    normalizedText.includes("vao nhom") ||
    normalizedText.includes("nhom kin") ||
    normalizedText.includes("duoc vao nhom") ||
    normalizedText.includes("roi a") ||
    normalizedText.includes("roi em") ||
    normalizedText.includes("em thay") ||
    normalizedText.includes("minh thay");

  const mentionsSchedule =
    normalizedText.includes("mai") ||
    normalizedText.includes("hom nay") ||
    normalizedText.includes("ngay mai") ||
    normalizedText.includes("buoi trua") ||
    normalizedText.includes("buoi toi") ||
    normalizedText.includes("lich") ||
    normalizedText.includes("livestream") ||
    normalizedText.includes("live") ||
    normalizedText.includes("linetrim") ||
    normalizedText.includes("interim") ||
    normalizedText.includes("buoi hoc") ||
    normalizedText.includes("buoi chia se");

  return confirmsJoined && mentionsSchedule;
}

function isAdvancedCourseQuestion(normalizedText) {
  return (
    normalizedText.includes("luat hap dan chuyen sau") ||
    normalizedText.includes("khoa chuyen sau") ||
    normalizedText.includes("hoc chuyen sau") ||
    normalizedText.includes("hoc sau") ||
    (normalizedText.includes("chuyen sau") &&
      (normalizedText.includes("luat hap dan") ||
        normalizedText.includes("khoa") ||
        normalizedText.includes("hoc phi") ||
        normalizedText.includes("gia") ||
        normalizedText.includes("bao nhieu") ||
        normalizedText.includes("tu van") ||
        normalizedText.includes("hoc")))
  );
}

function isCourseOverviewQuestion(normalizedText) {
  return (
    normalizedText.includes("khoa nay la khoa gi") ||
    normalizedText.includes("khoa do la khoa gi") ||
    normalizedText.includes("day la khoa gi") ||
    normalizedText.includes("khoa hoc gi") ||
    normalizedText.includes("co khoa hoc nao") ||
    normalizedText.includes("ben ban co khoa") ||
    normalizedText.includes("ben minh co khoa") ||
    normalizedText.includes("co khoa gi")
  );
}

function isMeditationFileRequest(normalizedText) {
  const asksForFile =
    normalizedText.includes("xin file") ||
    normalizedText.includes("nhan file") ||
    normalizedText.includes("gui file") ||
    normalizedText.includes("cho em file") ||
    normalizedText.includes("cho toi file") ||
    normalizedText.includes("lay file");

  const asksForMeditation =
    normalizedText.includes("thien") ||
    normalizedText.includes("thoi mien") ||
    normalizedText.includes("qua thoi mien") ||
    normalizedText.includes("phan qua");

  return asksForFile && asksForMeditation;
}

function isDebtFamilyPressureStatement(normalizedText) {
  const hasDebtPressure =
    /\bno\b/.test(normalizedText) ||
    normalizedText.includes("no nan") ||
    normalizedText.includes("no tien") ||
    normalizedText.includes("ap luc tai chinh") ||
    normalizedText.includes("ap luc tien");

  const hasFamilyIssue =
    normalizedText.includes("gia dinh") ||
    normalizedText.includes("con cai") ||
    normalizedText.includes("con om") ||
    normalizedText.includes("om dau") ||
    normalizedText.includes("benh") ||
    normalizedText.includes("chong") ||
    normalizedText.includes("vo");

  return hasDebtPressure && hasFamilyIssue;
}

function isHeavyDebtDisclosure(normalizedText) {
  const hasDebt =
    /\bno\b/.test(normalizedText) ||
    normalizedText.includes("no ngan hang") ||
    normalizedText.includes("no lai ngoai") ||
    normalizedText.includes("no anh em") ||
    normalizedText.includes("no nan");

  const hasLargeAmount =
    /\b\d+\s*(tr|trieu|ty)\b/.test(normalizedText) ||
    normalizedText.includes("tram trieu") ||
    normalizedText.includes("nhieu no");

  const hasDistress =
    normalizedText.includes("be tac") ||
    normalizedText.includes("cong ty") ||
    normalizedText.includes("pha san") ||
    normalizedText.includes("khong tra duoc") ||
    normalizedText.includes("tim huong di moi") ||
    normalizedText.includes("cong viec moi");

  return hasDebt && (hasLargeAmount || hasDistress);
}

function isGenericProblemStatement(normalizedText) {
  const hasGenericProblem =
    normalizedText.includes("van de") ||
    normalizedText.includes("kho khan") ||
    normalizedText.includes("gap kho") ||
    normalizedText.includes("dang ket") ||
    normalizedText.includes("be tac");

  if (!hasGenericProblem) {
    return false;
  }

  const hasSpecificProblem =
    /\bno\b/.test(normalizedText) ||
    normalizedText.includes("no tien") ||
    normalizedText.includes("het tien") ||
    normalizedText.includes("thieu tien") ||
    normalizedText.includes("dong tien") ||
    normalizedText.includes("doanh thu") ||
    normalizedText.includes("thu nhap") ||
    normalizedText.includes("it khach") ||
    normalizedText.includes("ban cham") ||
    normalizedText.includes("khong ra tien") ||
    normalizedText.includes("lo lang") ||
    normalizedText.includes("dong luc") ||
    normalizedText.includes("chi tieu") ||
    normalizedText.includes("tieu nhieu") ||
    normalizedText.includes("khong kiem soat");

  return !hasSpecificProblem;
}

function getGiftScriptKeywordAnswer() {
  return 'Bạn chat chữ "nhận" nhé[NEXT]Bên chatbot sẽ gửi kịch bản phần quà thôi miên cho bạn';
}

function isThanksResponse(normalizedText) {
  return (
    normalizedText === "cam on" ||
    normalizedText === "cam on a" ||
    normalizedText === "cam on nhe" ||
    normalizedText === "cam on thay" ||
    normalizedText === "cam on thay nhe" ||
    normalizedText.startsWith("cam on ") ||
    normalizedText === "thank" ||
    normalizedText === "thanks" ||
    normalizedText.startsWith("thank ")
  );
}

function getThanksReply(messages = []) {
  if (hasRecentAssistantMessage(messages, isMeditationFileAssistantMessage)) {
    return "Không có gì em nhé[NEXT]Em cứ thực hành đều 7 ngày, có gì vướng thì nhắn lại mình";
  }

  if (hasRecentAssistantMessage(messages, isRegistrationLinkAssistantMessage)) {
    return "Không có gì em nhé[NEXT]Em bấm link đăng ký, có gì chưa rõ cứ nhắn lại mình";
  }

  return "Không có gì em nhé";
}

function hasRecentAssistantMessage(messages, predicate) {
  return messages
    .slice(-6)
    .some(
      (message) =>
        message.role === "assistant" &&
        typeof message.content === "string" &&
        predicate(normalizeVietnameseText(message.content)),
    );
}

function isMeditationFileAssistantMessage(normalizedText) {
  return (
    normalizedText.includes("file thuc hanh thien") ||
    normalizedText.includes("thien hut tien") ||
    normalizedText.includes("youtu.be/hl_cwts2ay8") ||
    normalizedText.includes("lam vao thoi diem buoi sang")
  );
}

function isRegistrationLinkAssistantMessage(normalizedText) {
  return (
    normalizedText.includes("link dang ky") ||
    normalizedText.includes("luathapdan.vn/dao-tao/khoi-thong-dong-tien")
  );
}

function isGiftScriptRequest(normalizedText) {
  return (
    normalizedText.includes("qua thoi mien") ||
    normalizedText.includes("thoi mien") ||
    normalizedText.includes("phan qua") ||
    normalizedText.includes("nhan qua") ||
    normalizedText.includes("file thuc hanh") ||
    normalizedText.includes("kich ban")
  );
}

function isMoneyGratitudeRequest(normalizedText) {
  return (
    normalizedText.includes("tien") &&
    (normalizedText.includes("bai biet on") ||
      normalizedText.includes("bai cam on") ||
      normalizedText.includes("biet on tien") ||
      normalizedText.includes("cam on tien") ||
      normalizedText.includes("xin bai"))
  );
}

function isMoneyGratitudeNotSeen(normalizedText, messages) {
  if (
    !(
      normalizedText.includes("khong thay") ||
      normalizedText.includes("ko thay") ||
      normalizedText.includes("chua thay") ||
      normalizedText.includes("khong co") ||
      normalizedText.includes("ko co")
    )
  ) {
    return false;
  }

  return messages.some(
    (message) =>
      typeof message.content === "string" &&
      isMoneyGratitudeRequest(normalizeVietnameseText(message.content)),
  );
}

function isMoneyGratitudeSmallTalk(normalizedText, messages) {
  if (
    !(
      normalizedText.includes("tien khong choi") ||
      normalizedText.includes("tien ko choi") ||
      normalizedText.includes("tien chua choi") ||
      normalizedText.includes("tien tranh")
    )
  ) {
    return false;
  }

  return messages.some(
    (message) =>
      typeof message.content === "string" &&
      (isMoneyGratitudeRequest(normalizeVietnameseText(message.content)) ||
        normalizeVietnameseText(message.content).includes("bai cam on tien")),
  );
}

function getLastAssistantMessage(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "assistant") {
      return messages[index];
    }
  }

  return null;
}

function isRegistrationQuestion(text) {
  const normalizedText = normalizeVietnameseText(text);

  return (
    normalizedText.includes("khoi thong dong tien") &&
    (normalizedText.includes("dang ky") || normalizedText.includes("tham gia")) &&
    (normalizedText.includes("chua") ||
      normalizedText.includes("roi chu") ||
      normalizedText.includes("roi khong"))
  );
}

function hasNegativeResponse(normalizedText) {
  return /\b(khong|chua)\b/.test(normalizedText);
}

function isUnregisteredCourseResponse(normalizedText, lastAssistantText = "") {
  const hasCourseNegation =
    normalizedText.includes("chua dang ky") ||
    normalizedText.includes("chua tham gia") ||
    normalizedText.includes("chua hoc");

  if (hasCourseNegation) {
    return true;
  }

  return isRegistrationQuestion(lastAssistantText) && /\bchua\b/.test(normalizedText);
}

function isRegisteredCourseResponse(normalizedText) {
  if (hasNegativeResponse(normalizedText)) {
    return false;
  }

  return (
    normalizedText.includes("da dang ky") ||
    normalizedText.includes("dang ky roi") ||
    normalizedText.includes("hoc roi") ||
    normalizedText.includes("da hoc") ||
    normalizedText.includes("tham gia roi") ||
    normalizedText.includes("da tham gia")
  );
}

function getAssistantQuestionIntent(text) {
  const normalizedText = normalizeVietnameseText(text);

  if (!normalizedText.includes("?")) {
    return "";
  }

  if (isRegistrationQuestion(text)) {
    return "registration_status";
  }

  if (
    normalizedText.includes("lo lang") ||
    normalizedText.includes("tien bac") ||
    normalizedText.includes("dong luc") ||
    normalizedText.includes("chi tieu") ||
    normalizedText.includes("kiem soat")
  ) {
    return "problem_confirmation";
  }

  if (
    normalizedText.includes("kho khan") ||
    normalizedText.includes("van de") ||
    normalizedText.includes("chia se")
  ) {
    return "problem_detail";
  }

  return "";
}

async function handlePageEcho(event, env) {
  const senderId = event.recipient?.id;
  const text = event.message?.text;

  if (!senderId) {
    return;
  }

  const normalizedText = typeof text === "string" ? normalizeVietnameseText(text) : "";

  if (!isAhachatFlowMessage(normalizedText)) {
    if (!isAppEcho(event)) {
      await markHumanTakeover(senderId, env, typeof text === "string" ? text : "");
    }
    return;
  }

  const chatState = await getChatState(senderId, env);
  const messages = chatState.messages;
  const isCourseQuestion = isAhachatCourseQuestion(normalizedText);

  if (
    isCourseQuestion &&
    !isRegistrationQuestion(getLastAssistantMessage(messages)?.content || "")
  ) {
    messages.push({
      role: "assistant",
      content: text,
    });
  }

  await saveChatState(
    senderId,
    {
      ...chatState,
      messages: messages.slice(-MAX_HISTORY_MESSAGES),
      lastSeen: chatState.lastSeen || new Date().toISOString(),
      status: isCourseQuestion ? "interested" : chatState.status,
      ahachatGate: isCourseQuestion ? "ready_for_course_answer" : "waiting_for_course_question",
      ahachatGateAt: new Date().toISOString(),
    },
    env,
  );
}

function shouldIgnoreAhachatUserMessage(normalizedText, chatState) {
  if (isAhachatConsentReply(normalizedText)) {
    return true;
  }

  if (isHumanFollowupMessage(normalizedText)) {
    return false;
  }

  return (
    chatState.ahachatGate === "waiting_for_course_question" &&
    !shouldHandleAhachatCourseAnswer(normalizedText, chatState)
  );
}

function shouldHandleAhachatCourseAnswer(normalizedText, chatState) {
  if (
    chatState.ahachatGate !== "ready_for_course_answer" &&
    chatState.ahachatGate !== "waiting_for_course_question"
  ) {
    return false;
  }

  return isCourseParticipationAnswer(normalizedText) || isCourseParticipationAffirmative(normalizedText);
}

function getAhachatWaitingState(chatState) {
  return {
    ...chatState,
    ahachatGate: "waiting_for_course_question",
    ahachatGateAt: new Date().toISOString(),
  };
}

function isHumanFollowupMessage(normalizedText) {
  return (
    normalizedText === "alo" ||
    normalizedText.startsWith("alo ") ||
    normalizedText.includes("nhan minh") ||
    normalizedText.includes("nhan voi ai") ||
    normalizedText.includes("ai di") ||
    normalizedText.includes("ban oi") ||
    normalizedText.includes("co ai")
  );
}

function isAhachatConsentReply(normalizedText) {
  return (
    normalizedText === "dong y" ||
    normalizedText === "toi dong y" ||
    normalizedText === "minh dong y" ||
    normalizedText === "em dong y" ||
    normalizedText.includes("dong y nhan file") ||
    normalizedText.includes("nhan file")
  );
}

function isGiveawayTriggerText(normalizedText) {
  const exactTriggers = [
    "nhan",
    "nhan qua",
    "toi nhan",
    "em nhan",
    "minh nhan",
    "cho toi nhan",
    "cho em nhan",
    "gui toi",
    "gui em",
  ];

  return (
    exactTriggers.includes(normalizedText) ||
    normalizedText.includes("comment nhan") ||
    normalizedText.includes("binh luan nhan") ||
    normalizedText.includes("nhan qua thoi mien") ||
    normalizedText.includes("nhan phan qua") ||
    normalizedText.includes("xin nhan qua")
  );
}

function isAutomationStartMessage(normalizedText) {
  return normalizedText === "bat dau" || normalizedText === "get started" || normalizedText === "start";
}

function isCourseParticipationAnswer(normalizedText) {
  const exactAnswers = [
    "chua",
    "em chua",
    "minh chua",
    "toi chua",
    "chua tham gia",
    "roi",
    "roi a",
    "roi nhe",
    "co roi",
    "da roi",
    "em roi",
    "minh roi",
    "toi roi",
    "tham gia roi",
    "da tham gia",
  ];

  return (
    exactAnswers.includes(normalizedText) ||
    isUnregisteredCourseResponse(normalizedText, AHACHAT_COURSE_QUESTION) ||
    isRegisteredCourseResponse(normalizedText) ||
    normalizedText.includes("co roi") ||
    normalizedText.includes("da roi") ||
    normalizedText.includes("chua tham gia") ||
    normalizedText.includes("tham gia roi") ||
    normalizedText.includes("da tham gia")
  );
}

function isCourseParticipationAffirmative(normalizedText) {
  const exactAnswers = [
    "co",
    "co a",
    "co ak",
    "em co",
    "minh co",
    "toi co",
    "vang",
    "vang a",
    "vang ak",
    "da",
    "da a",
    "da ak",
    "roi",
    "roi a",
    "roi ak",
  ];

  return exactAnswers.includes(normalizedText);
}

function isAhachatFlowMessage(normalizedText) {
  return (
    isAhachatCourseQuestion(normalizedText) ||
    normalizedText.includes("file thuc hanh thien ket noi voi tien") ||
    normalizedText.includes("youtu.be/hl_cwts2ay8") ||
    normalizedText.includes("lam vao thoi diem buoi sang") ||
    normalizedText.includes("dang gap van de gi voi tai chinh")
  );
}

function isAhachatCourseQuestion(normalizedText) {
  return (
    normalizedText.includes("khoi thong dong tien") &&
    normalizedText.includes("mien phi") &&
    normalizedText.includes("da tham gia") &&
    normalizedText.includes("roi chu")
  );
}

function updateCustomerProfile(userText, currentProfile = {}, messages = []) {
  const normalizedText = normalizeVietnameseText(userText);
  const profile = sanitizeCustomerProfile(currentProfile);
  const lastAssistantMessage = getLastAssistantMessage(messages);
  const lastAssistantIntent = getAssistantQuestionIntent(lastAssistantMessage?.content || "");
  const questionStreak = countRecentAssistantQuestions(messages);

  if (isSimpleRegistrationAffirmative(normalizedText) && lastAssistantIntent === "registration_status") {
    profile.registered = true;
    profile.nextStep = "Hẹn khách ở buổi học tiếp theo";
  } else if (
    isRegisteredCourseResponse(normalizedText) ||
    (!hasNegativeResponse(normalizedText) && normalizedText.includes("xong roi"))
  ) {
    profile.registered = true;
    profile.nextStep = "Hẹn khách ở buổi học tiếp theo";
  } else if (
    isUnregisteredCourseResponse(normalizedText, lastAssistantMessage?.content || "")
  ) {
    profile.registered = false;
    profile.nextStep = "Gửi link đăng ký khóa Khơi Thông Dòng Tiền";
  }

  if (!hasNegativeResponse(normalizedText) && (normalizedText.includes("hoc roi") || normalizedText.includes("da hoc"))) {
    profile.hasAttended = true;
    profile.registered = true;
    profile.nextStep = "Hẹn khách ở buổi học tiếp theo";
  }

  if (isPaidCoursePaymentQuestion(normalizedText)) {
    profile.nextStep = "Xin số điện thoại để tư vấn học phí và đặt cọc";
  }

  if (isGroupOrScheduleConfirmation(normalizedText)) {
    profile.registered = true;
    profile.nextStep = "Nhắc khách theo dõi thông báo trong nhóm để vào buổi học đúng giờ";
  }

  const business = extractBusiness(userText, normalizedText);
  if (business) {
    profile.business = business;
  }

  const duration = extractDuration(normalizedText);
  if (duration) {
    profile.duration = duration;
  }

  const problemType = classifyProblemType(normalizedText);
  if (problemType) {
    profile.problemType = problemType;
  }

  if (
    isAffirmativeResponse(normalizedText) &&
    lastAssistantIntent === "problem_confirmation"
  ) {
    if (!profile.problem) {
      profile.problem = "Khach xac nhan co lo lang hoac van de ve tien bac";
    }
    if (!profile.problemType) {
      profile.problemType = "lo lang/be tac cam xuc";
    }
  }

  if (isProblemMessage(normalizedText)) {
    profile.problem = truncateText(userText, 160);
    if (!profile.nextStep) {
      profile.nextStep = "Tìm hiểu thêm vấn đề và dẫn vào năng lượng tiền bạc";
    }
  }

  profile.lastAssistantIntent = lastAssistantIntent || profile.lastAssistantIntent;
  profile.questionStreak = questionStreak;
  profile.readyToClose = shouldMoveToClose(profile, normalizedText, questionStreak);
  profile.conversationStage = getConversationStage(profile, normalizedText, questionStreak);
  profile.strategy = getConversationStrategy(profile);

  return profile;
}

function sanitizeCustomerProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return {};
  }

  return {
    business: typeof profile.business === "string" ? profile.business : "",
    problem: typeof profile.problem === "string" ? profile.problem : "",
    duration: typeof profile.duration === "string" ? profile.duration : "",
    problemType: typeof profile.problemType === "string" ? profile.problemType : "",
    registered: typeof profile.registered === "boolean" ? profile.registered : null,
    hasAttended: typeof profile.hasAttended === "boolean" ? profile.hasAttended : null,
    nextStep: typeof profile.nextStep === "string" ? profile.nextStep : "",
    conversationStage:
      typeof profile.conversationStage === "string" ? profile.conversationStage : "discovering",
    lastAssistantIntent:
      typeof profile.lastAssistantIntent === "string" ? profile.lastAssistantIntent : "",
    questionStreak: Number.isInteger(profile.questionStreak) ? profile.questionStreak : 0,
    readyToClose: typeof profile.readyToClose === "boolean" ? profile.readyToClose : false,
    strategy: typeof profile.strategy === "string" ? profile.strategy : "",
  };
}

function extractBusiness(userText, normalizedText) {
  const businessMarkers = ["kinh doanh", "ban", "lam"];
  const marker = businessMarkers.find((item) => normalizedText.includes(`${item} `));

  if (!marker) {
    return "";
  }

  const markerIndex = normalizedText.indexOf(`${marker} `);
  const originalText = userText.slice(markerIndex + marker.length).trim();

  return truncateText(originalText, 80);
}

function extractDuration(normalizedText) {
  const durationMatch = normalizedText.match(
    /((hon|gan|khoang|tam|vai)\s+)?\d+\s+(ngay|tuan|thang|nam)|may\s+(ngay|tuan|thang|nam)|vai\s+(ngay|tuan|thang|nam)/,
  );

  return durationMatch ? durationMatch[0] : "";
}

function isProblemMessage(normalizedText) {
  const problemKeywords = [
    "be tac",
    "thieu tien",
    "het tien",
    "dong tien",
    "tai chinh",
    "doanh thu",
    "thu nhap",
    "it khach",
    "ban cham",
    "khong ra tien",
    "lo lang",
    "kho khan",
    "dong luc",
    "chi tieu",
    "tieu nhieu",
    "hao tien",
    "khong kiem soat",
    "mat kiem soat",
  ];

  return (
    /\bno\b/.test(normalizedText) ||
    problemKeywords.some((keyword) => normalizedText.includes(keyword))
  );
}

function classifyProblemType(normalizedText) {
  if (
    normalizedText.includes("chi tieu") ||
    normalizedText.includes("tieu nhieu") ||
    normalizedText.includes("hao tien") ||
    normalizedText.includes("khong kiem soat") ||
    normalizedText.includes("mat kiem soat")
  ) {
    return "chi tieu mat kiem soat";
  }

  if (/\bno\b/.test(normalizedText) || normalizedText.includes("dong tien")) {
    return "nợ/kẹt dòng tiền";
  }

  if (
    normalizedText.includes("it khach") ||
    normalizedText.includes("doanh thu") ||
    normalizedText.includes("ban cham")
  ) {
    return "ít khách/doanh thu tụt";
  }

  if (
    normalizedText.includes("tri hoan") ||
    normalizedText.includes("khong dam") ||
    normalizedText.includes("so that bai") ||
    normalizedText.includes("dong luc")
  ) {
    return "trì hoãn/sợ hành động";
  }

  if (
    normalizedText.includes("lo lang") ||
    normalizedText.includes("tieu cuc") ||
    normalizedText.includes("met moi") ||
    normalizedText.includes("be tac")
  ) {
    return "lo lắng/bế tắc cảm xúc";
  }

  if (
    normalizedText.includes("tai chinh") ||
    normalizedText.includes("thu nhap") ||
    normalizedText.includes("khong ra tien")
  ) {
    return "tài chính/thu nhập thấp";
  }

  return "";
}

function countRecentAssistantQuestions(messages) {
  const assistantMessages = messages
    .filter((message) => message.role === "assistant" && typeof message.content === "string")
    .slice(-3);

  let count = 0;

  for (let index = assistantMessages.length - 1; index >= 0; index -= 1) {
    const content = assistantMessages[index].content;

    if (!content.includes("?")) {
      break;
    }

    count += 1;
  }

  return count;
}

function isAffirmativeResponse(normalizedText) {
  if (hasNegativeResponse(normalizedText)) {
    return false;
  }

  const affirmatives = [
    "co",
    "e co",
    "em co",
    "minh co",
    "toi co",
    "dung",
    "dung roi",
    "chinh xac",
    "em bi",
    "co bi",
    "giong vay",
    "phai",
    "vang",
    "da",
  ];

  return affirmatives.some(
    (affirmative) =>
      normalizedText === affirmative || normalizedText.startsWith(`${affirmative} `),
  );
}

function shouldMoveToClose(profile, normalizedText, questionStreak) {
  if (profile.registered === true || profile.hasAttended === true) {
    return false;
  }

  if (isHeavyDebtDisclosure(normalizedText)) {
    return false;
  }

  if (profile.registered === false) {
    return true;
  }

  const hasEnoughContext =
    Boolean(profile.problemType || profile.problem) && Boolean(profile.duration || profile.business);
  const hasStrongPain = isProblemMessage(normalizedText);

  return (
    (hasEnoughContext && questionStreak >= 2) ||
    (hasStrongPain && questionStreak >= 2) ||
    (isAffirmativeResponse(normalizedText) && Boolean(profile.problemType || profile.problem)) ||
    (questionStreak >= 3 && Boolean(profile.problemType || profile.problem))
  );
}

function getConversationStage(profile, normalizedText, questionStreak) {
  if (profile.registered === true || profile.hasAttended === true) {
    return "registered";
  }

  if (profile.readyToClose) {
    return "closing";
  }

  if (profile.problemType || (profile.problem && questionStreak >= 1)) {
    return "diagnosing";
  }

  if (isProblemMessage(normalizedText)) {
    return "diagnosing";
  }

  return "discovering";
}

function getConversationStrategy(profile) {
  if (profile.conversationStage === "registered") {
    return "Dừng hỏi, chỉ hẹn khách ở buổi học tiếp theo.";
  }

  if (profile.conversationStage === "closing") {
    return "Không hỏi thêm vấn đề; phản chiếu ngắn, chốt mềm bằng câu hỏi đã đăng ký chưa hoặc gửi link nếu khách chưa đăng ký.";
  }

  if (profile.conversationStage === "diagnosing") {
    return "Không hỏi lan man; chẩn đoán vấn đề, đưa insight năng lượng tiền bạc, rồi dẫn sang chốt mềm.";
  }

  return "Hỏi tối đa 1 câu để lấy thông tin còn thiếu, ưu tiên ngành/vấn đề/thời gian.";
}

function getUpdatedStatus(userText, currentStatus) {
  const normalizedText = normalizeVietnameseText(userText);

  if (isGroupOrScheduleConfirmation(normalizedText)) {
    return "registered";
  }

  if (isPaidCoursePaymentQuestion(normalizedText)) {
    return "interested";
  }

  if (
    isRegisteredCourseResponse(normalizedText) ||
    (!hasNegativeResponse(normalizedText) && normalizedText.includes("xong roi"))
  ) {
    return "registered";
  }

  if (
    normalizedText.includes("dang ky") ||
    normalizedText.includes("link") ||
    normalizedText.includes("tham gia") ||
    normalizedText.includes("ve")
  ) {
    return "interested";
  }

  return currentStatus;
}

function getAhachatAnswerStatus(normalizedText, isAhachatCourseAnswer) {
  if (!isAhachatCourseAnswer) {
    return "";
  }

  return hasNegativeResponse(normalizedText) ? "interested" : "registered";
}

function normalizeVietnameseText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\b(k|ko)\b/g, "khong")
    .replace(/\bnhju\b/g, "nhieu")
    .replace(/\bbjo\b/g, "bay gio")
    .replace(/\bdj\b/g, "di")
    .replace(/\bak\b/g, "a")
    .replace(/\s+/g, " ")
    .trim();
}

async function saveToSheet(senderId, firstMessage) {
  try {
    await fetch(
      "https://script.google.com/macros/s/AKfycbxT6ubzHH46HjmqxvfPY_RuoSiHpnNCGaSUOp6SSAud7BDZpQec_Wy5QwZI4w5Y9ouB/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
          facebook_id: senderId,
          first_message: firstMessage,
          status: "Mới",
        }),
      },
    );
  } catch (err) {
    console.error("Sheet error:", err);
  }
}

async function getChatState(senderId, env) {
  const rawHistory = await env.CHAT_HISTORY.get(senderId);

  if (!rawHistory) {
    return {
      messages: [],
      lastSeen: null,
      status: "new",
      firstMessage: "",
      customerProfile: {},
      ahachatGate: null,
      ahachatGateAt: null,
      humanTakeoverUntil: null,
    };
  }

  try {
    const data = JSON.parse(rawHistory);

    if (Array.isArray(data)) {
      return {
        messages: sanitizeMessages(data),
        lastSeen: null,
        status: "new",
        firstMessage: getFirstUserMessage(data),
        customerProfile: {},
        ahachatGate: null,
        ahachatGateAt: null,
        humanTakeoverUntil: null,
      };
    }

    if (data && typeof data === "object") {
      return {
        messages: sanitizeMessages(data.messages),
        lastSeen: typeof data.lastSeen === "string" ? data.lastSeen : null,
        status: isValidStatus(data.status) ? data.status : "new",
        firstMessage:
          typeof data.firstMessage === "string"
            ? data.firstMessage
            : getFirstUserMessage(data.messages),
        customerProfile: sanitizeCustomerProfile(data.customerProfile),
        ahachatGate: isValidAhachatGate(data.ahachatGate) ? data.ahachatGate : null,
        ahachatGateAt: typeof data.ahachatGateAt === "string" ? data.ahachatGateAt : null,
        humanTakeoverUntil:
          typeof data.humanTakeoverUntil === "string" ? data.humanTakeoverUntil : null,
      };
    }

    return {
      messages: [],
      lastSeen: null,
      status: "new",
      firstMessage: "",
      customerProfile: {},
      ahachatGate: null,
      ahachatGateAt: null,
      humanTakeoverUntil: null,
    };
  } catch (error) {
    console.error("Invalid chat history JSON", error);
    return {
      messages: [],
      lastSeen: null,
      status: "new",
      firstMessage: "",
      customerProfile: {},
      ahachatGate: null,
      ahachatGateAt: null,
      humanTakeoverUntil: null,
    };
  }
}

async function saveChatState(senderId, state, env) {
  await env.CHAT_HISTORY.put(senderId, JSON.stringify(state), {
    expirationTtl: 2592000,
  });
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
    .slice(-MAX_HISTORY_MESSAGES);
}

function getFirstUserMessage(messages) {
  if (!Array.isArray(messages)) {
    return "";
  }

  const firstUserMessage = messages.find(
    (message) => message.role === "user" && typeof message.content === "string",
  );

  return firstUserMessage?.content || "";
}

function isValidStatus(status) {
  return (
    status === "new" ||
    status === "interested" ||
    status === "registered" ||
    status === "remarketed"
  );
}

function isValidAhachatGate(gate) {
  return gate === "waiting_for_course_question" || gate === "ready_for_course_answer";
}

function isAppEcho(event) {
  return Boolean(
    event.message?.app_id || event.message?.metadata === BOT_ECHO_METADATA,
  );
}

function getHumanTakeoverTtlMinutes(env) {
  const ttlMinutes = Number(env.HUMAN_TAKEOVER_TTL_MINUTES);
  return Number.isFinite(ttlMinutes) && ttlMinutes > 0
    ? ttlMinutes
    : DEFAULT_HUMAN_TAKEOVER_TTL_MINUTES;
}

function getHumanTakeoverUntil(env, now = new Date()) {
  return new Date(now.getTime() + getHumanTakeoverTtlMinutes(env) * 60 * 1000).toISOString();
}

function isHumanTakeoverActive(chatState, now = new Date()) {
  if (typeof chatState?.humanTakeoverUntil !== "string") {
    return false;
  }

  const takeoverUntil = new Date(chatState.humanTakeoverUntil);
  return !Number.isNaN(takeoverUntil.getTime()) && takeoverUntil > now;
}

async function runRemarketing(env) {
  let cursor;
  const now = new Date();

  do {
    const keys = await env.CHAT_HISTORY.list({ cursor });

    for (const key of keys.keys) {
      const raw = await env.CHAT_HISTORY.get(key.name);
      if (!raw) {
        continue;
      }

      let data;

      try {
        data = JSON.parse(raw);
      } catch (error) {
        console.error("Invalid remarketing JSON", error);
        continue;
      }

      if (
        !data.lastSeen ||
        !data.status ||
        data.status === "registered" ||
        isHumanTakeoverActive(data, now)
      ) {
        continue;
      }

      const lastSeen = new Date(data.lastSeen);
      const hoursAgo = (now - lastSeen) / (1000 * 60 * 60);

      if (hoursAgo >= 20 && hoursAgo < 21) {
        const senderId = key.name;
        const message =
          data.status === "interested"
            ? "Hôm qua bạn có hỏi về khóa học Khơi Thông Dòng Tiền, bạn đăng ký chưa nhỉ? Link đây nếu cần: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien-thuonghieu"
            : "Hôm qua mình có nói chuyện, bạn có muốn tìm hiểu thêm về khóa Khơi Thông Dòng Tiền không? Khóa miễn phí đó bạn ơi";

        await sendMessengerText(senderId, message, env);

        data.status = "remarketed";
        await env.CHAT_HISTORY.put(key.name, JSON.stringify(data), {
          expirationTtl: 2592000,
        });
      }
    }

    cursor = keys.list_complete ? undefined : keys.cursor;
  } while (cursor);
}

async function askClaude(messages, env, userText, customerProfile = {}) {
  const ragContext = shouldRetrieveRagContext(userText)
    ? await retrieveRagContext(userText, env)
    : null;
  const baseSystemText = ragContext
    ? `${CLAUDE_SYSTEM_PROMPT}\n\nNỘI DUNG LIÊN QUAN TỪ KHÓA HỌC:\n${ragContext}`
    : CLAUDE_SYSTEM_PROMPT;
  const systemText = `${baseSystemText}\n\n${CLAUDE_RUNTIME_GUARDRAILS}`;
  const claudeMessages = getClaudeMessages(messages, Boolean(ragContext), customerProfile);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 420,
      system: [
        {
          type: "text",
          text: systemText,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: claudeMessages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = Array.isArray(data.content)
    ? data.content
        .filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("\n")
        .trim()
    : "";

  return text || "Thầy đã nhận được tin nhắn và sẽ phản hồi bạn sớm nhé.";
}

function getClaudeMessages(messages, hasRagContext, customerProfile = {}) {
  const profileMessage = getCustomerProfileMessage(customerProfile);

  if (!hasRagContext) {
    return profileMessage ? [profileMessage, ...messages] : messages;
  }

  const summaryMessage = messages.find(
    (message) =>
      message.role === "user" &&
      typeof message.content === "string" &&
      normalizeVietnameseText(message.content).includes("tom tat cuoc hoi thoai truoc"),
  );
  const recentMessages = messages.slice(-RAG_RECENT_MESSAGES);

  if (!summaryMessage || recentMessages.includes(summaryMessage)) {
    return profileMessage ? [profileMessage, ...recentMessages] : recentMessages;
  }

  return profileMessage
    ? [profileMessage, summaryMessage, ...recentMessages]
    : [summaryMessage, ...recentMessages];
}

function getCustomerProfileMessage(customerProfile) {
  const profile = sanitizeCustomerProfile(customerProfile);
  const details = [];

  if (profile.business) {
    details.push(`ngành: ${profile.business}`);
  }

  if (profile.problem) {
    details.push(`vấn đề: ${profile.problem}`);
  }

  if (profile.duration) {
    details.push(`thời gian: ${profile.duration}`);
  }

  if (profile.problemType) {
    details.push(`loại vấn đề: ${profile.problemType}`);
  }

  if (profile.registered !== null) {
    details.push(`đăng ký: ${profile.registered ? "đã đăng ký" : "chưa đăng ký"}`);
  }

  if (profile.hasAttended !== null) {
    details.push(`đã học: ${profile.hasAttended ? "rồi" : "chưa"}`);
  }

  if (profile.nextStep) {
    details.push(`bước tiếp theo: ${profile.nextStep}`);
  }

  if (profile.conversationStage) {
    details.push(`giai đoạn: ${profile.conversationStage}`);
  }

  if (profile.lastAssistantIntent) {
    details.push(`ngu canh cau hoi truoc: ${profile.lastAssistantIntent}`);
  }

  if (profile.questionStreak > 0) {
    details.push(`vừa hỏi liên tiếp: ${profile.questionStreak}`);
  }

  if (profile.readyToClose) {
    details.push("đã đủ tín hiệu để chốt mềm");
  }

  if (profile.strategy) {
    details.push(`chiến lược lượt này: ${profile.strategy}`);
  }

  if (details.length === 0) {
    return null;
  }

  return {
    role: "user",
    content: `[HỒ SƠ KHÁCH: ${details.join("; ")}]`,
  };
}

function shouldRetrieveRagContext(userText) {
  const normalizedText = normalizeVietnameseText(userText);

  if (normalizedText.length < 12) {
    return false;
  }

  const shortReplies = [
    "chao",
    "hello",
    "hi",
    "ok",
    "vang",
    "da",
    "co",
    "chua",
    "cam on",
  ];

  if (shortReplies.includes(normalizedText)) {
    return false;
  }

  const skipPhrases = [
    "dang ky roi",
    "da dang ky",
    "hoc roi",
    "xin link",
    "gui link",
    "cho em link",
  ];

  if (skipPhrases.some((phrase) => normalizedText.includes(phrase))) {
    return false;
  }

  const ragKeywords = [
    "quang cao",
    "tim hieu them",
    "mien phi",
    "4 buoi",
    "dao tao",
    "khoa",
    "hoc phi",
    "gia",
    "bao nhieu",
    "may buoi",
    "lich hoc",
    "noi dung",
    "chuong trinh",
    "zoom",
    "video",
    "thay mong",
    "luat hap dan",
    "nhan qua",
    "khoi thong dong tien",
    "chuyen sau",
    "tu van",
  ];

  return ragKeywords.some((keyword) => normalizedText.includes(keyword));
}

async function retrieveRagContext(userText, env) {
  try {
    const queryEmbedding = await env.AI.run("@cf/baai/bge-m3", { text: [userText] });
    const queryVector = queryEmbedding.data?.[0];

    if (!Array.isArray(queryVector)) {
      return null;
    }

    const results = await env.RAG_INDEX.query(queryVector, {
      topK: 2,
      returnMetadata: "all",
    });

    const chunks = (results.matches || [])
      .filter((match) => match.score >= 0.5)
      .map((match) => match.metadata?.text)
      .filter((text) => typeof text === "string" && text.trim())
      .map((text) => truncateText(text, 600));

    return chunks.length > 0 ? truncateText(chunks.join("\n\n"), 1200) : null;
  } catch (error) {
    console.error("RAG retrieval error", error);
    return null;
  }
}

function truncateText(text, maxLength) {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength).trim()}...`;
}

async function summarizeMessages(messages, env) {
  const lastMessages = messages.slice(-SUMMARY_RECENT_MESSAGES);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_SUMMARY_MODEL,
      max_tokens: 70,
      system:
        "Tóm tắt cực ngắn bằng tiếng Việt, tối đa 45 từ. Chỉ giữ: vấn đề chính của khách, trạng thái đã/chưa đăng ký hoặc đã học nếu có, bước tiếp theo cần làm. Không kể lại hội thoại, không thêm lời khuyên.",
      messages,
    }),
  });

  if (!response.ok) {
    console.error(`Claude summary error: ${response.status} ${await response.text()}`);
    return messages;
  }

  const data = await response.json();
  const summary = Array.isArray(data.content)
    ? data.content
        .filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("\n")
        .trim()
    : "";

  if (!summary) {
    return messages;
  }

  return [
    {
      role: "user",
      content: `[TÓM TẮT CUỘC HỘI THOẠI TRƯỚC: ${summary}]`,
    },
    ...lastMessages,
  ];
}

async function sendMessengerParts(recipientId, text, env) {
  const parts = sanitizeOutgoingText(text)
    .split("[NEXT]")
    .map((part) => part.trim())
    .filter(Boolean);

  for (let index = 0; index < parts.length; index += 1) {
    await sendMessengerAction(recipientId, "typing_on", env);
    await delay(getHumanTypingDelay(parts[index], index));
    await sendMessengerText(recipientId, parts[index], env);
  }
}

async function sendMeditationFileFlow(recipientId, env) {
  await sendMessengerText(recipientId, MEDITATION_FILE_BLOCK, env);
  await sendMessengerText(recipientId, MEDITATION_FILE_NOTE, env);
  await delay(30000);
  await sendMessengerText(recipientId, AHACHAT_COURSE_QUESTION, env);
}

function sanitizeOutgoingText(text) {
  return text
    .replace(/anh\s*\/\s*ch\u1ecb/gi, "bạn")
    .replace(/anh ch\u1ecb/gi, "bạn")
    .replace(/\banh\b/gi, "bạn")
    .replace(/\bch\u1ecb\b/gi, "bạn")
    .replace(/\btớ\b/gi, "mình")
    .replace(/\btôi\b/gi, "mình")
    .replace(/\bthầy\b/gi, "mình");
}

function limitWords(text, maxWords) {
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) {
    return text;
  }

  const sentenceEndIndex = words.findIndex(
    (word, index) => index >= 8 && /[.!?]$/.test(word),
  );

  if (sentenceEndIndex > -1 && sentenceEndIndex < maxWords) {
    return words.slice(0, sentenceEndIndex + 1).join(" ");
  }

  return words.slice(0, maxWords).join(" ");
}

function getHumanTypingDelay(text, index) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const baseDelay = index === 0 ? 1800 : 1200;
  const typingDelay = baseDelay + wordCount * 180 + charCount * 18;
  const jitter = Math.floor(Math.random() * 900);

  return Math.min(Math.max(typingDelay + jitter, 1800), 8500);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendMessengerAction(recipientId, action, env) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(
      env.PAGE_ACCESS_TOKEN,
    )}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: action,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Messenger action error: ${response.status} ${await response.text()}`);
  }
}

async function sendMessengerText(recipientId, text, env) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(
      env.PAGE_ACCESS_TOKEN,
    )}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: {
          text: text.slice(0, 2000),
          metadata: BOT_ECHO_METADATA,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Messenger API error: ${response.status} ${await response.text()}`);
  }
}
