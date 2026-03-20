const membersCount = document.getElementById("membersCount");
const member3Block = document.getElementById("member3Block");
const member4Block = document.getElementById("member4Block");
const form = document.getElementById("hackathonForm");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");

const successCard = document.getElementById("successCard");
const applicationIdText = document.getElementById("applicationIdText");
const ticketLinkBtn = document.getElementById("ticketLinkBtn");
const whatsappGroupBtn = document.getElementById("whatsappGroupBtn");
const calculatedFee = document.getElementById("calculatedFee");
const calculatedFeeValue = document.getElementById("calculatedFeeValue");
const paymentScreenshotInput = document.getElementById("paymentScreenshot");

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzssXMNF0CJ0z8H8ZU53IELVnPfMZFOMUDdZGnJHOxwouf43nOC-SvCxYUUDcoVdRd3/exec";
const DEFAULT_WHATSAPP_URL =
  "https://chat.whatsapp.com/IkGdFlQv1wmAE5tStHLCOJ";
const REQUEST_TIMEOUT_MS = 45000;

const FIELD_PREFIXES = {
  leader: ["Name", "College", "Department", "Email", "Whatsapp", "Year"],
  member2: ["Name", "College", "Department", "Email", "Whatsapp", "Year"],
  member3: ["Name", "College", "Department", "Email", "Whatsapp", "Year"],
  member4: ["Name", "College", "Department", "Email", "Whatsapp", "Year"]
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initializeFormUI();
});

function bindEvents() {
  if (membersCount) {
    membersCount.addEventListener("change", handleTeamSizeChange);
  }

  if (paymentScreenshotInput) {
    paymentScreenshotInput.addEventListener("change", handleFilePreviewValidation);
  }

  bindLiveValidationEvents();

  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }
}

function bindLiveValidationEvents() {
  const prefixes = ["leader", "member2", "member3", "member4"];

  prefixes.forEach((prefix) => {
    const emailInput = document.getElementById(prefix + "Email");
    const phoneInput = document.getElementById(prefix + "Whatsapp");
    const yearInput = document.getElementById(prefix + "Year");

    if (emailInput) {
      emailInput.addEventListener("input", () => {
        emailInput.value = emailInput.value.trimStart();
        clearDuplicateValidity();
        validateUniqueEmailsAndPhones(true);
      });

      emailInput.addEventListener("blur", () => {
        emailInput.value = emailInput.value.trim();
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        phoneInput.value = sanitizePhoneInput(phoneInput.value);
        clearDuplicateValidity();
        validatePhoneNumberField(phoneInput, true);
        validateUniqueEmailsAndPhones(true);
      });

      phoneInput.addEventListener("blur", () => {
        validatePhoneNumberField(phoneInput, false);
      });
    }

    if (yearInput) {
      yearInput.addEventListener("change", () => {
        clearFieldValidity(yearInput);
      });
    }
  });

  const transactionIdInput = document.getElementById("transactionId");
  if (transactionIdInput) {
    transactionIdInput.addEventListener("input", () => {
      transactionIdInput.value = transactionIdInput.value.trimStart();
      clearFieldValidity(transactionIdInput);
    });
  }

  const declarationInput = document.getElementById("declaration");
  if (declarationInput) {
    declarationInput.addEventListener("change", () => {
      if (declarationInput.checked) {
        resetStatus();
      }
    });
  }
}

function initializeFormUI() {
  toggleMemberBlocks();
  updateFeeDisplay();
  resetSuccessCard();
  resetStatus();
  setSubmitButtonIdle();
}

function handleTeamSizeChange() {
  toggleMemberBlocks();
  updateFeeDisplay();
  clearDuplicateValidity();
  validateUniqueEmailsAndPhones(true);
  resetStatus();
}

function updateFeeDisplay() {
  if (!membersCount || !calculatedFee || !calculatedFeeValue) return;

  const count = Number(membersCount.value || 0);
  const feeMap = {
    2: 600,
    3: 750,
    4: 900
  };

  const fee = feeMap[count] || 0;
  calculatedFee.textContent = `₹${fee}`;
  calculatedFeeValue.value = fee ? String(fee) : "";
}

function toggleMemberBlocks() {
  const count = Number(membersCount?.value || 0);

  if (member3Block) {
    const showMember3 = count >= 3;
    member3Block.classList.toggle("hidden", !showMember3);
    setMemberRequired("member3", showMember3);
    if (!showMember3) clearMemberFields("member3");
  }

  if (member4Block) {
    const showMember4 = count === 4;
    member4Block.classList.toggle("hidden", !showMember4);
    setMemberRequired("member4", showMember4);
    if (!showMember4) clearMemberFields("member4");
  }
}

function setMemberRequired(prefix, isRequired) {
  const fields = FIELD_PREFIXES[prefix] || [];
  fields.forEach((field) => {
    const element = document.getElementById(prefix + field);
    if (element) {
      element.required = isRequired;
      if (!isRequired) {
        element.setCustomValidity("");
      }
    }
  });
}

function clearMemberFields(prefix) {
  const fields = FIELD_PREFIXES[prefix] || [];
  fields.forEach((field) => {
    const element = document.getElementById(prefix + field);
    if (!element) return;

    if (element.tagName === "SELECT") {
      element.selectedIndex = 0;
    } else {
      element.value = "";
    }

    element.setCustomValidity("");
  });
}

function setStatus(message, type = "") {
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className = "status";

  if (type) {
    statusMessage.classList.add(type);
  }
}

function resetStatus() {
  if (!statusMessage) return;
  statusMessage.textContent = "";
  statusMessage.className = "status";
}

function resetSuccessCard() {
  if (successCard) successCard.classList.add("hidden");
  if (applicationIdText) applicationIdText.textContent = "";
  if (ticketLinkBtn) ticketLinkBtn.href = "#";
  if (whatsappGroupBtn) whatsappGroupBtn.href = DEFAULT_WHATSAPP_URL;
}

function handleFilePreviewValidation() {
  const file = paymentScreenshotInput?.files?.[0];

  if (!file) return;

  const error = validateFile(file);
  if (error) {
    setStatus(error, "error");
    paymentScreenshotInput.value = "";
    return;
  }

  setStatus("Payment screenshot selected successfully.", "success");
}

function validateFile(file) {
  if (!file) {
    return "Please upload the payment screenshot.";
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/pdf"
  ];

  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
  const lowerName = String(file.name || "").toLowerCase();
  const validExtension = allowedExtensions.some((ext) => lowerName.endsWith(ext));

  if (!(allowedTypes.includes(file.type) || validExtension)) {
    return "Only JPG, JPEG, PNG, WEBP, or PDF files are allowed.";
  }

  if (file.size > 10 * 1024 * 1024) {
    return "File size must be less than 10 MB.";
  }

  return "";
}

async function optimizeUploadFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const isPdf =
    file.type === "application/pdf" ||
    String(file.name || "").toLowerCase().endsWith(".pdf");

  if (isPdf) return file;

  const isImage = file.type.startsWith("image/");
  if (!isImage) return file;

  if (file.size <= 800 * 1024) return file;

  return compressImage(file);
}

function compressImage(file) {
  return new Promise((resolve) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      image.src = event.target?.result;
    };

    reader.onerror = () => resolve(file);

    image.onload = () => {
      try {
        let width = image.width;
        let height = image.height;
        const maxDimension = 1600;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height >= width && height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(file);
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile = new File(
              [blob],
              renameFileExtension(file.name, "jpg"),
              { type: "image/jpeg" }
            );

            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          "image/jpeg",
          0.72
        );
      } catch (error) {
        resolve(file);
      }
    };

    image.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function renameFileExtension(fileName, extensionWithoutDot) {
  const baseName = String(fileName || "payment_screenshot").replace(/\.[^/.]+$/, "");
  return `${baseName}.${extensionWithoutDot}`;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = String(reader.result || "");
        const base64 = result.split(",")[1];

        if (!base64) {
          reject(new Error("Could not process the selected file."));
          return;
        }

        resolve(base64);
      } catch (error) {
        reject(new Error("Could not process the selected file."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsDataURL(file);
  });
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function getCheckedValue(id) {
  const element = document.getElementById(id);
  return element && element.checked ? "Yes" : "No";
}

function sanitizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function sanitizePhoneInput(value) {
  return sanitizePhone(value).slice(0, 10);
}

function sanitizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getVisibleTeamPrefixes() {
  const count = Number(membersCount?.value || 0);
  const prefixes = ["leader", "member2"];

  if (count >= 3) prefixes.push("member3");
  if (count === 4) prefixes.push("member4");

  return prefixes;
}

function clearFieldValidity(field) {
  if (field) {
    field.setCustomValidity("");
  }
}

function clearDuplicateValidity() {
  const prefixes = ["leader", "member2", "member3", "member4"];

  prefixes.forEach((prefix) => {
    const emailInput = document.getElementById(prefix + "Email");
    const phoneInput = document.getElementById(prefix + "Whatsapp");

    if (emailInput) emailInput.setCustomValidity("");
    if (phoneInput) phoneInput.setCustomValidity("");
  });
}

function validatePhoneNumberField(field, silent = false) {
  if (!field) return { valid: true, message: "" };

  field.setCustomValidity("");
  const raw = sanitizePhone(field.value);

  if (!raw) {
    return { valid: true, message: "" };
  }

  if (raw.length !== 10) {
    field.setCustomValidity("WhatsApp number must be exactly 10 digits.");
    if (!silent) {
      field.reportValidity();
    }
    return {
      valid: false,
      message: "WhatsApp number must be exactly 10 digits."
    };
  }

  if (!/^[6-9]/.test(raw)) {
    field.setCustomValidity("Enter a valid Indian mobile number starting with 6, 7, 8, or 9.");
    if (!silent) {
      field.reportValidity();
    }
    return {
      valid: false,
      message: "Enter a valid Indian mobile number starting with 6, 7, 8, or 9."
    };
  }

  return { valid: true, message: "" };
}

function validateAllPhoneNumbers() {
  const prefixes = getVisibleTeamPrefixes();

  for (const prefix of prefixes) {
    const phoneInput = document.getElementById(prefix + "Whatsapp");
    const result = validatePhoneNumberField(phoneInput, true);

    if (!result.valid) {
      return result;
    }
  }

  return { valid: true, message: "" };
}

function validateUniqueEmailsAndPhones(silent = false) {
  const prefixes = getVisibleTeamPrefixes();
  const seenEmails = new Map();
  const seenPhones = new Map();

  clearDuplicateValidity();

  for (const prefix of prefixes) {
    const emailElement = document.getElementById(prefix + "Email");
    const phoneElement = document.getElementById(prefix + "Whatsapp");

    const email = sanitizeEmail(emailElement?.value);
    const phone = sanitizePhone(phoneElement?.value);

    if (email) {
      if (seenEmails.has(email)) {
        if (emailElement) {
          emailElement.setCustomValidity("Duplicate email is not allowed within the same team.");
        }
        return {
          valid: false,
          message: "Duplicate email IDs are not allowed within the same team."
        };
      }
      seenEmails.set(email, prefix);
    }

    if (phone) {
      if (seenPhones.has(phone)) {
        if (phoneElement) {
          phoneElement.setCustomValidity("Duplicate WhatsApp number is not allowed within the same team.");
        }
        return {
          valid: false,
          message: "Duplicate WhatsApp numbers are not allowed within the same team."
        };
      }
      seenPhones.set(phone, prefix);
    }
  }

  if (!silent) {
    const invalidField = form?.querySelector(":invalid");
    if (invalidField) {
      invalidField.reportValidity();
    }
  }

  return { valid: true, message: "" };
}

function validateTeamMemberCount() {
  const count = Number(membersCount?.value || 0);

  if (![2, 3, 4].includes(count)) {
    return {
      valid: false,
      message: "Please select a valid team size."
    };
  }

  return { valid: true, message: "" };
}

function validateDeclaration() {
  const declaration = document.getElementById("declaration");

  if (!declaration?.checked) {
    return {
      valid: false,
      message: "Please accept the declaration before submitting."
    };
  }

  return { valid: true, message: "" };
}

function collectFormData(file, base64File) {
  return {
    teamName: getValue("teamName"),
    membersCount: getValue("membersCount"),
    calculatedFee: getValue("calculatedFeeValue"),

    leaderName: getValue("leaderName"),
    leaderCollege: getValue("leaderCollege"),
    leaderDepartment: getValue("leaderDepartment"),
    leaderEmail: getValue("leaderEmail"),
    leaderWhatsapp: getValue("leaderWhatsapp"),
    leaderYear: getValue("leaderYear"),

    member2Name: getValue("member2Name"),
    member2College: getValue("member2College"),
    member2Department: getValue("member2Department"),
    member2Email: getValue("member2Email"),
    member2Whatsapp: getValue("member2Whatsapp"),
    member2Year: getValue("member2Year"),

    member3Name: getValue("member3Name"),
    member3College: getValue("member3College"),
    member3Department: getValue("member3Department"),
    member3Email: getValue("member3Email"),
    member3Whatsapp: getValue("member3Whatsapp"),
    member3Year: getValue("member3Year"),

    member4Name: getValue("member4Name"),
    member4College: getValue("member4College"),
    member4Department: getValue("member4Department"),
    member4Email: getValue("member4Email"),
    member4Whatsapp: getValue("member4Whatsapp"),
    member4Year: getValue("member4Year"),

    transactionId: getValue("transactionId"),
    specialRequirements: getValue("specialRequirements"),
    declaration: getCheckedValue("declaration"),

    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileData: base64File
  };
}

function generateFallbackApplicationId() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");

  return `HV2026APP-TEMP-${stamp}`;
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function openPendingPopup(name) {
  try {
    const popupWindow = window.open("", name);

    if (popupWindow && !popupWindow.closed) {
      popupWindow.document.write(`
        <html>
          <head>
            <title>Please wait...</title>
            <meta charset="UTF-8" />
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #eff6ff, #ffffff, #fef3c7);
                color: #0f172a;
              }
              .box {
                width: min(90%, 420px);
                background: #ffffff;
                border-radius: 20px;
                padding: 28px 24px;
                text-align: center;
                box-shadow: 0 14px 30px rgba(15, 23, 42, 0.15);
              }
              .spinner {
                width: 48px;
                height: 48px;
                margin: 0 auto 16px;
                border: 4px solid #dbeafe;
                border-top-color: #2563eb;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
              }
              h3 {
                margin: 0 0 10px;
                font-size: 24px;
              }
              p {
                margin: 0;
                color: #475569;
                line-height: 1.6;
              }
              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="spinner"></div>
              <h3>Please wait...</h3>
              <p>Your registration is being processed.</p>
            </div>
          </body>
        </html>
      `);
      popupWindow.document.close();
    }

    return popupWindow;
  } catch (error) {
    return null;
  }
}

function setSubmitButtonLoading() {
  if (!submitBtn) return;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="btn-loader"></span> Submitting...`;
}

function setSubmitButtonIdle() {
  if (!submitBtn) return;
  submitBtn.disabled = false;
  submitBtn.textContent = "Submit Registration";
}

function focusAndScrollToField(field) {
  if (!field) return;
  field.focus({ preventScroll: true });
  field.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

async function handleFormSubmit(event) {
  event.preventDefault();
  resetSuccessCard();

  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE")) {
    setStatus("Please paste your Google Apps Script Web App URL in script.js first.", "error");
    return;
  }

  clearDuplicateValidity();

  if (!form?.checkValidity()) {
    const invalidField = form.querySelector(":invalid");
    if (invalidField) {
      invalidField.reportValidity();
      focusAndScrollToField(invalidField);
    }
    return;
  }

  const teamSizeValidation = validateTeamMemberCount();
  if (!teamSizeValidation.valid) {
    setStatus(teamSizeValidation.message, "error");
    if (membersCount) focusAndScrollToField(membersCount);
    return;
  }

  const phoneValidation = validateAllPhoneNumbers();
  if (!phoneValidation.valid) {
    setStatus(phoneValidation.message, "error");
    const invalidField = form.querySelector(":invalid");
    if (invalidField) {
      invalidField.reportValidity();
      focusAndScrollToField(invalidField);
    }
    return;
  }

  const declarationValidation = validateDeclaration();
  if (!declarationValidation.valid) {
    setStatus(declarationValidation.message, "error");
    const declarationField = document.getElementById("declaration");
    if (declarationField) focusAndScrollToField(declarationField);
    return;
  }

  const uniqueValidation = validateUniqueEmailsAndPhones(true);
  if (!uniqueValidation.valid) {
    setStatus(uniqueValidation.message, "error");
    const invalidInput = form.querySelector(":invalid");
    if (invalidInput) {
      invalidInput.reportValidity();
      focusAndScrollToField(invalidInput);
    }
    return;
  }

  if (!calculatedFeeValue?.value) {
    setStatus("Please select the team size to calculate the fee.", "error");
    if (membersCount) focusAndScrollToField(membersCount);
    return;
  }

  const file = paymentScreenshotInput?.files?.[0];
  const fileError = validateFile(file);
  if (fileError) {
    setStatus(fileError, "error");
    if (paymentScreenshotInput) focusAndScrollToField(paymentScreenshotInput);
    return;
  }

  const ticketWindow = openPendingPopup("hackverse_ticket_window");
  const whatsappWindow = openPendingPopup("hackverse_whatsapp_window");

  setSubmitButtonLoading();
  setStatus("Submitting application and generating your ticket...", "loading");

  try {
    const optimizedFile = await optimizeUploadFile(file);
    const base64File = await readFileAsBase64(optimizedFile);
    const payload = collectFormData(optimizedFile, base64File);

    const response = await fetchWithTimeout(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      }
    });

    const resultText = await response.text();
    let result;

    try {
      result = JSON.parse(resultText);
    } catch (error) {
      throw new Error("Invalid server response. Please check Apps Script deployment and permissions.");
    }

    if (result.status === "success") {
      const applicationId = result.applicationId || generateFallbackApplicationId();
      const ticketUrl = result.ticketUrl || "#";
      const whatsappUrl = result.whatsappUrl || DEFAULT_WHATSAPP_URL;

      if (applicationIdText) applicationIdText.textContent = applicationId;
      if (ticketLinkBtn) ticketLinkBtn.href = ticketUrl;
      if (whatsappGroupBtn) whatsappGroupBtn.href = whatsappUrl;
      if (successCard) successCard.classList.remove("hidden");

      setStatus(
        `Application submitted successfully. Your unique Application ID is ${applicationId}.`,
        "success"
      );

      if (ticketWindow && !ticketWindow.closed && ticketUrl !== "#") {
        ticketWindow.location.href = ticketUrl;
      } else if (ticketUrl !== "#") {
        window.open(ticketUrl, "_blank");
      }

      if (whatsappWindow && !whatsappWindow.closed && whatsappUrl) {
        whatsappWindow.location.href = whatsappUrl;
      } else if (whatsappUrl) {
        window.open(whatsappUrl, "_blank");
      }

      form.reset();
      toggleMemberBlocks();
      updateFeeDisplay();
      clearDuplicateValidity();

      if (successCard) {
        successCard.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    } else {
      if (ticketWindow && !ticketWindow.closed) ticketWindow.close();
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
      setStatus(result.message || "Submission failed. Please try again.", "error");
    }
  } catch (error) {
    if (ticketWindow && !ticketWindow.closed) ticketWindow.close();
    if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();

    if (error.name === "AbortError") {
      setStatus("Request timed out. Please try again.", "error");
    } else {
      setStatus(error.message || "An error occurred while submitting the form.", "error");
    }

    console.error("Form submission error:", error);
  } finally {
    setSubmitButtonIdle();
  }
}