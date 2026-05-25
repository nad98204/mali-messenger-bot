const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_SUMMARY_MODEL = "claude-3-5-haiku-20241022";
const MAX_HISTORY_MESSAGES = 6;
const SUMMARY_TRIGGER_MESSAGES = 6;
const CLAUDE_SYSTEM_PROMPT = `Bạn là Thầy Mong, đang nhắn trực tiếp với học viên tiềm năng qua Messenger. Không nói mình là bot, trợ lý hay AI.

Xưng hô: Nếu khách xưng "tôi" hoặc "mình" thì xưng "mình" và gọi khách là "anh/chị" kèm tên nếu biết. Nếu khách xưng "em" thì xưng "mình" và gọi khách là "em". Nếu khách chưa xưng rõ thì tránh gọi danh xưng, chỉ nói "mình". Không bao giờ dùng "tôi" hay "tớ". Không tự xưng "e/em".

Phong cách: Nhắn ít, điềm, tự nhiên, có chiều sâu. Mỗi lượt tối đa 2 tin, mỗi tin tối đa 14 từ. Dùng [NEXT] chỉ khi thật cần tách 2 tin. Không emoji, không bullet, không in đậm. Không hỏi nếu chưa thật sự cần.

Mục tiêu: không chỉ hỏi. Hãy tư vấn theo nhịp: lắng nghe -> chẩn đoán -> gỡ góc nhìn -> chốt mềm khóa Khơi Thông Dòng Tiền khi đủ tín hiệu.

Luật chống hỏi nhiều:
- Không hỏi quá 1 lượt liên tiếp.
- Nếu đã biết vấn đề chính và thời gian/hoàn cảnh, dừng hỏi và chuyển sang chẩn đoán.
- Nếu khách nói bế tắc, nợ, kẹt dòng tiền, tụt doanh thu, lo lắng, sợ tiền hoặc xác nhận "đúng/có", không hỏi vòng nữa.
- Không hỏi kiểu xoáy như "có phải tiền cứ trốn mình không?".
- Không phản biện khách kiểu "nhiều người cùng hoàn cảnh mà kết quả khác nhau".
- Không làm khách thấy bị sai, bị dạy đời, bị chất vấn.
- Khi khách trả lời ngắn, hãy phản chiếu và đưa insight ngắn, không hỏi tiếp ngay.

Chẩn đoán ngắn theo vấn đề:
- Nợ/kẹt tiền: nỗi sợ và áp lực làm mình càng co lại, quyết định tiền bạc dễ rối.
- Ít khách/doanh thu tụt: năng lượng thiếu tin và cần tiền gấp khiến cách bán hàng bị nặng.
- Trì hoãn/không dám làm: thường là niềm tin tiền bạc sai và sợ thất bại đang kéo lại.
- Lo lắng/tiêu cực: cảm xúc thấp làm dòng chảy tài chính bị nghẽn.

Khi chẩn đoán: phản chiếu đúng vấn đề khách, nói 1 insight ngắn, rồi dừng hoặc chốt mềm. Đừng hứa chữa khỏi, giàu lên, hết nợ hay đổi đời. Không dùng giọng thách thức.

Khi chốt: Nếu khách đã chia sẻ rõ đau đớn hoặc đã xác nhận bị năng lượng tiền bạc chặn, hỏi: "Em đăng ký khóa Khơi Thông Dòng Tiền rồi chưa?" Nếu khách chưa đăng ký thì gửi link ngay: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien-thuonghieu

Nếu đã đăng ký hoặc đã học rồi: "Tuyệt vời quá[NEXT]Hẹn gặp lại em/anh/chị ở buổi học tiếp theo nhé" rồi dừng, không hỏi thêm.

Cần tư vấn sâu hơn: "Em nhắn trợ lý mình nha, sdt 0355 067 656"

Không được bịa đặt thông tin về Thầy Mong. Chỉ dùng đúng 2 ý khi cần kể chuyện: hơn chục năm trước thầy bị lừa mất hết tiền, vướng nợ, thất nghiệp; thầy thay đổi nhờ hiểu đúng Luật Hấp Dẫn và Nhân Quả, giờ tài chính vững vàng.`;

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

  const tasks = [];

  for (const entry of payload.entry) {
    const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];

    for (const event of messagingEvents) {
      if (event.postback?.payload === "GET_STARTED" && event.sender?.id) {
        tasks.push(handleMessage(event.sender.id, "Xin chào", env));
        continue;
      }

      if (event.message?.is_echo || !event.sender?.id) {
        continue;
      }

      if (event.message?.text) {
        tasks.push(handleMessage(event.sender.id, event.message.text, env));
      } else if (event.optin) {
        tasks.push(handleMessage(event.sender.id, "xin chào", env));
      } else if (event.postback) {
        tasks.push(
          handleMessage(
            event.sender.id,
            event.postback.title || event.postback.payload,
            env,
          ),
        );
      }
    }
  }

  await Promise.allSettled(tasks);
}

async function handleMessage(senderId, userText, env) {
  try {
    const chatState = await getChatState(senderId, env);
    let messages = chatState.messages;
    const isFirstMessage = messages.length === 0;

    if (isFirstMessage) {
      await saveToSheet(senderId, userText);
    }

    messages.push({
      role: "user",
      content: userText,
    });

    const customerProfile = updateCustomerProfile(
      userText,
      chatState.customerProfile,
      messages,
    );
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
        status: getUpdatedStatus(userText, chatState.status),
        firstMessage: chatState.firstMessage || userText,
        customerProfile,
      };

      await env.CHAT_HISTORY.put(senderId, JSON.stringify(updatedState), {
        expirationTtl: 2592000,
      });

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
      status: getUpdatedStatus(userText, chatState.status),
      firstMessage: chatState.firstMessage || userText,
      customerProfile,
    };

    await env.CHAT_HISTORY.put(senderId, JSON.stringify(updatedState), {
      expirationTtl: 2592000,
    });

    await sendMessengerParts(senderId, answer, env);
  } catch (error) {
    console.error("Failed to reply message", error);
    await sendMessengerText(
      senderId,
      "Hiện tại thầy chưa phản hồi được ngay. Cô/chú/bạn vui lòng nhắn lại sau ít phút nhé.",
      env,
    );
  }
}

function getRuleBasedAnswer(userText, messages = []) {
  const normalizedText = normalizeVietnameseText(userText);
  const greetings = ["chao", "xin chao", "chao thay", "xin chao thay", "hello", "hi"];

  if (greetings.includes(normalizedText)) {
    return "Mình đây, đang cần mình hỗ trợ gì về tài chính không?";
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

  if (["chua", "em chua", "minh chua", "toi chua"].includes(normalizedText)) {
    const lastAssistantMessage = getLastAssistantMessage(messages);

    if (lastAssistantMessage && isRegistrationQuestion(lastAssistantMessage.content)) {
      return "Thế em kích link sau đăng ký nhé[NEXT]Đây là link nha: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien-thuonghieu[NEXT]Kích vào link đăng ký luôn nhé";
    }
  }

  if (
    normalizedText.includes("da dang ky") ||
    normalizedText.includes("dang ky roi") ||
    normalizedText.includes("hoc roi") ||
    normalizedText.includes("da hoc")
  ) {
    return "Tuyệt vời quá[NEXT]Hẹn gặp lại em/anh/chị ở buổi học tiếp theo nhé";
  }

  if (
    normalizedText.includes("xin link") ||
    normalizedText.includes("gui link") ||
    normalizedText.includes("cho em link") ||
    normalizedText.includes("link dang ky") ||
    normalizedText.includes("dang ky o dau") ||
    normalizedText.includes("muon dang ky")
  ) {
    return "Thế em kích link sau đăng ký nhé[NEXT]Đây là link nha: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien-thuonghieu[NEXT]Kích vào link đăng ký luôn nhé";
  }

  if (
    normalizedText.includes("so dien thoai") ||
    normalizedText.includes("sdt") ||
    normalizedText.includes("tro ly") ||
    normalizedText.includes("tu van sau")
  ) {
    return "Em nhắn trợ lý mình nha, sdt 0355 067 656";
  }

  const exactAcknowledgements = ["vang", "da"];
  const flexibleAcknowledgements = ["ok", "cam on", "thank", "thanks"];

  if (
    exactAcknowledgements.includes(normalizedText) ||
    flexibleAcknowledgements.some(
      (acknowledgement) =>
        normalizedText === acknowledgement || normalizedText.startsWith(`${acknowledgement} `),
    )
  ) {
    return "Mình nhận được rồi nhé";
  }

  return null;
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
    normalizedText.includes("dang ky") &&
    normalizedText.includes("khoi thong dong tien") &&
    normalizedText.includes("chua")
  );
}

function updateCustomerProfile(userText, currentProfile = {}, messages = []) {
  const normalizedText = normalizeVietnameseText(userText);
  const profile = sanitizeCustomerProfile(currentProfile);
  const lastAssistantMessage = getLastAssistantMessage(messages);
  const questionStreak = countRecentAssistantQuestions(messages);

  if (
    normalizedText.includes("da dang ky") ||
    normalizedText.includes("dang ky roi") ||
    normalizedText.includes("xong roi")
  ) {
    profile.registered = true;
    profile.nextStep = "Hẹn khách ở buổi học tiếp theo";
  } else if (
    normalizedText.includes("chua dang ky") ||
    (["chua", "em chua", "minh chua", "toi chua"].includes(normalizedText) &&
      lastAssistantMessage &&
      isRegistrationQuestion(lastAssistantMessage.content))
  ) {
    profile.registered = false;
    profile.nextStep = "Gửi link đăng ký khóa Khơi Thông Dòng Tiền";
  }

  if (normalizedText.includes("hoc roi") || normalizedText.includes("da hoc")) {
    profile.hasAttended = true;
    profile.registered = true;
    profile.nextStep = "Hẹn khách ở buổi học tiếp theo";
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

  if (isProblemMessage(normalizedText)) {
    profile.problem = truncateText(userText, 160);
    if (!profile.nextStep) {
      profile.nextStep = "Tìm hiểu thêm vấn đề và dẫn vào năng lượng tiền bạc";
    }
  }

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
  ];

  return (
    /\bno\b/.test(normalizedText) ||
    problemKeywords.some((keyword) => normalizedText.includes(keyword))
  );
}

function classifyProblemType(normalizedText) {
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
    normalizedText.includes("so that bai")
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
  const affirmatives = [
    "co",
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

  if (profile.registered === false) {
    return true;
  }

  const hasEnoughContext =
    Boolean(profile.problemType || profile.problem) && Boolean(profile.duration || profile.business);
  const hasStrongPain = isProblemMessage(normalizedText);

  return (
    hasEnoughContext ||
    (hasStrongPain && questionStreak >= 1) ||
    (isAffirmativeResponse(normalizedText) && Boolean(profile.problemType || profile.problem)) ||
    questionStreak >= 2
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

  if (
    normalizedText.includes("da dang ky") ||
    normalizedText.includes("dang ky roi") ||
    normalizedText.includes("hoc roi") ||
    normalizedText.includes("da hoc") ||
    normalizedText.includes("xong roi")
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

function normalizeVietnameseText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
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
      };
    }

    return {
      messages: [],
      lastSeen: null,
      status: "new",
      firstMessage: "",
      customerProfile: {},
    };
  } catch (error) {
    console.error("Invalid chat history JSON", error);
    return {
      messages: [],
      lastSeen: null,
      status: "new",
      firstMessage: "",
      customerProfile: {},
    };
  }
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

      if (!data.lastSeen || !data.status || data.status === "registered") {
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
  const systemText = ragContext
    ? `${CLAUDE_SYSTEM_PROMPT}\n\nNỘI DUNG LIÊN QUAN TỪ KHÓA HỌC:\n${ragContext}`
    : CLAUDE_SYSTEM_PROMPT;
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
      max_tokens: 180,
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

  return text || "Thầy đã nhận được tin nhắn và sẽ phản hồi cô/chú/bạn sớm nhé.";
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
  const recentMessages = messages.slice(-2);

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
  const lastMessages = messages.slice(-2);
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
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => limitWords(part, 32));

  for (let index = 0; index < parts.length; index += 1) {
    await sendMessengerAction(recipientId, "typing_on", env);
    await delay(getHumanTypingDelay(parts[index], index));
    await sendMessengerText(recipientId, parts[index], env);
  }
}

function sanitizeOutgoingText(text) {
  return text
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
        message: { text: text.slice(0, 2000) },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Messenger API error: ${response.status} ${await response.text()}`);
  }
}
