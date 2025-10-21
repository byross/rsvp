// Email HTML templates

interface InvitationEmailData {
  guestName: string;
  inviteUrl: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
}

interface ConfirmationEmailData {
  guestName: string;
  dinner: boolean;
  cocktail: boolean;
  workshopType?: string | null;
  workshopTime?: string | null;
  qrCodeDataURL: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
}

/**
 * 邀請郵件 - 情況一（具名嘉賓）
 */
export function generateNamedGuestInvitationEmail(data: InvitationEmailData): string {
  return `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>活動邀請</title>
  <style>
    body {
      font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      padding: 0;
      text-align: center;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #667eea;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .event-details {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 30px 0;
    }
    .event-details h3 {
      margin-top: 0;
      color: #667eea;
    }
    .event-details p {
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background: #bfdbfe;
      color: #000000;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      background: #93c5fd;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://rsvp.momini.app/images/logo.jpeg" alt="${data.eventName}" style="width: 100%; max-width: 600px; height: auto; display: block; border-radius: 12px 12px 0 0;" />
    </div>
    <div class="content">
      <p class="greeting">親愛的 <strong>${data.guestName}</strong>，</p>
      <p class="message">
        誠摯邀請您出席我們的特別活動！這將是一個充滿歡樂與回憶的夜晚，我們期待與您共度美好時光。
      </p>
      
      <div class="event-details">
        <h3>活動詳情</h3>
        <p><strong>活動名稱：</strong>${data.eventName}</p>
        <p><strong>日期時間：</strong>${data.eventDate}</p>
        <p><strong>活動地點：</strong>${data.eventVenue}</p>
      </div>

      <p class="message">
        活動包括：
      </p>
      <ul style="margin: 20px 0; padding-left: 20px; line-height: 1.8;">
        <li>晚宴</li>
        <li>雞尾酒會</li>
        <li>工作坊體驗（皮革 / 香水）</li>
      </ul>

      <center>
        <a href="${data.inviteUrl}" class="cta-button">
          立即確認出席
        </a>
      </center>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        請點擊上方按鈕填寫 RSVP 表單，告訴我們您的出席意願及工作坊選擇。
      </p>
    </div>
    <div class="footer">
      <p>期待您的蒞臨！</p>
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        © 2025 <a href="https://byross.mo" style="color: #667eea; text-decoration: none;">byRoss Design and Tech</a>
        <br>
        byRoss RSVP V1.0
      </p>
      <p style="margin-top: 10px; font-size: 11px; color: #ccc;">
        此郵件由活動邀請系統自動發送
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 邀請郵件 - 情況二（公司邀請）
 */
export function generateCompanyInvitationEmail(data: InvitationEmailData): string {
  return `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>活動邀請</title>
  <style>
    body {
      font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      padding: 0;
      text-align: center;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #667eea;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .event-details {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 30px 0;
    }
    .event-details h3 {
      margin-top: 0;
      color: #667eea;
    }
    .event-details p {
      margin: 10px 0;
    }
    .notice-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: #bfdbfe;
      color: #000000;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      background: #93c5fd;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://rsvp.momini.app/images/logo.jpeg" alt="${data.eventName}" style="width: 100%; max-width: 600px; height: auto; display: block; border-radius: 12px 12px 0 0;" />
    </div>
    <div class="content">
      <p class="greeting">尊敬的 <strong>${data.guestName}</strong>，</p>
      <p class="message">
        誠摯邀請貴公司派代表出席我們的特別活動！這將是一個充滿歡樂與回憶的夜晚，我們期待與您共度美好時光。
      </p>
      
      <div class="notice-box">
        <strong>重要提示：</strong><br>
        請在填寫 RSVP 表單時，輸入實際出席者的姓名及聯絡資料。
      </div>

      <div class="event-details">
        <h3>活動詳情</h3>
        <p><strong>活動名稱：</strong>${data.eventName}</p>
        <p><strong>日期時間：</strong>${data.eventDate}</p>
        <p><strong>活動地點：</strong>${data.eventVenue}</p>
      </div>

      <p class="message">
        活動包括：
      </p>
      <ul style="margin: 20px 0; padding-left: 20px; line-height: 1.8;">
        <li>晚宴</li>
        <li>雞尾酒會</li>
        <li>工作坊體驗（皮革 / 香水）</li>
      </ul>

      <center>
        <a href="${data.inviteUrl}" class="cta-button">
          填寫出席者資料
        </a>
      </center>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        請點擊上方按鈕填寫 RSVP 表單，告訴我們出席者的姓名、出席意願及工作坊選擇。
      </p>
    </div>
    <div class="footer">
      <p>期待您的蒞臨！</p>
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        © 2025 <a href="https://byross.mo" style="color: #667eea; text-decoration: none;">byRoss Design and Tech</a>
        <br>
        byRoss RSVP V1.0
      </p>
      <p style="margin-top: 10px; font-size: 11px; color: #ccc;">
        此郵件由活動邀請系統自動發送
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 確認郵件（含 QR Code）
 */
export function generateConfirmationEmail(data: ConfirmationEmailData): string {
  const workshopName = data.workshopType === 'leather' ? '皮革工作坊' : 
                       data.workshopType === 'perfume' ? '香水工作坊' : null;
  
  const workshopTimeFormatted = data.workshopTime ? 
    `${data.workshopTime.slice(0, 2)}:${data.workshopTime.slice(2)}` : null;

  return `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RSVP 確認</title>
  <style>
    body {
      font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      padding: 0;
      text-align: center;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #10b981;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .summary-box {
      background: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .summary-box h3 {
      margin-top: 0;
      color: #10b981;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #d1fae5;
    }
    .summary-item:last-child {
      border-bottom: none;
    }
    .qr-code-box {
      text-align: center;
      padding: 30px;
      background: white;
      border: 3px dashed #10b981;
      border-radius: 12px;
      margin: 30px 0;
    }
    .qr-code-box img {
      max-width: 250px;
      height: auto;
    }
    .qr-code-box p {
      margin-top: 15px;
      font-size: 14px;
      color: #666;
    }
    .important-notice {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 30px 0;
    }
    .important-notice h4 {
      margin-top: 0;
      color: #f59e0b;
    }
    .important-notice ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://rsvp.momini.app/images/logo.jpeg" alt="RSVP 確認成功" style="width: 100%; max-width: 600px; height: auto; display: block; border-radius: 12px 12px 0 0;" />
    </div>
    <div class="content">
      <h2 style="color: #10b981; text-align: center; font-size: 28px; margin: 0 0 20px 0;">✓ RSVP 確認成功！</h2>
      <p class="greeting">親愛的 <strong>${data.guestName}</strong>，</p>
      <p class="message">
        感謝您的確認！我們已收到您的 RSVP 回覆。以下是您的出席資料摘要：
      </p>
      
      <div class="summary-box">
        <h3>您的確認資料</h3>
        <div class="summary-item">
          <span>姓名：</span>
          <strong>${data.guestName}</strong>
        </div>
        <div class="summary-item">
          <span>晚宴：</span>
          <strong>${data.dinner ? '✓ 出席' : '✗ 不出席'}</strong>
        </div>
        <div class="summary-item">
          <span>雞尾酒會：</span>
          <strong>${data.cocktail ? '✓ 出席' : '✗ 不出席'}</strong>
        </div>
        ${workshopName ? `
        <div class="summary-item">
          <span>工作坊：</span>
          <strong>${workshopName}</strong>
        </div>
        <div class="summary-item">
          <span>時段：</span>
          <strong>${workshopTimeFormatted}</strong>
        </div>
        ` : ''}
      </div>

      <div class="qr-code-box">
        <h3 style="color: #10b981; margin-top: 0;">您的活動 QR Code</h3>
        <img src="${data.qrCodeDataURL}" alt="QR Code" />
        <p><strong>請保存此 QR Code</strong></p>
        <p>活動當日請出示此 QR Code 以便簽到</p>
      </div>

      <div class="important-notice">
        <h4>⚠️ 重要提示</h4>
        <ul>
          <li>請妥善保存此郵件及 QR Code</li>
          <li>活動當日請提早 15 分鐘到達</li>
          <li>簽到時請出示 QR Code（可列印或使用手機顯示）</li>
          ${workshopName ? `<li>您的工作坊為：${workshopName}（${workshopTimeFormatted}）</li>` : ''}
          <li>如需修改資料，請聯絡活動負責人</li>
        </ul>
      </div>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-top: 30px;">
        <h4 style="margin-top: 0; color: #10b981;">活動詳情</h4>
        <p><strong>活動名稱：</strong>${data.eventName}</p>
        <p><strong>日期時間：</strong>${data.eventDate}</p>
        <p><strong>活動地點：</strong>${data.eventVenue}</p>
      </div>
    </div>
    <div class="footer">
      <p>期待在活動中見到您！</p>
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        © 2025 <a href="https://byross.mo" style="color: #667eea; text-decoration: none;">byRoss Design and Tech</a>
        <br>
        byRoss RSVP V1.0
      </p>
      <p style="margin-top: 10px; font-size: 11px; color: #ccc;">
        此郵件由活動邀請系統自動發送
      </p>
    </div>
  </div>
</body>
</html>
  `;
}


