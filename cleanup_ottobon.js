const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content);
}

// 1. OttobonWebsiteWizard.tsx
replaceInFile('src/components/ottobon/OttobonWebsiteWizard.tsx', [
  [/export default function WebsiteOnboardingWizard\(\{ brand \}: WebsiteOnboardingWizardProps\)/, 'export default function OttobonWebsiteWizard()'],
  [/const isOttobon = brand === 'ottobon';/, "const isOttobon = true; const brand = 'ottobon';"]
]);

// 2. OttobonWhatsAppWizard.tsx
replaceInFile('src/components/ottobon/OttobonWhatsAppWizard.tsx', [
  [/export default function WhatsAppAutomationOnboardingWizard\(\{ brand \}: WhatsAppAutomationOnboardingWizardProps\)/, 'export default function OttobonWhatsAppWizard()'],
  [/const isOttobon = brand === 'ottobon';/, "const isOttobon = true; const brand = 'ottobon';"]
]);

// 3. OttobonGbpWizard.tsx
replaceInFile('src/components/ottobon/OttobonGbpWizard.tsx', [
  [/export default function ClientOnboardingFormContent\(\{ brand \}: ClientOnboardingFormContentProps\)/, 'export default function OttobonGbpWizard()'],
  [/const isOttobon = brand === 'ottobon';/, "const isOttobon = true;\n  const brand = 'ottobon';"]
]);

// 4. Ottobon Success Page
replaceInFile('src/app/ottobon/onboarding/success/page.tsx', [
  [/const isOttobon = client\.onboarding_details\?\.brand === 'ottobon' \|\| client\.onboarding_details\?\.business_type === 'education' \|\| client\.onboarding_details\?\.business_type === 'Educational Institute';/, 'const isOttobon = true;']
]);

console.log('Ottobon components initialized.');
