const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content);
}

replaceInFile('src/components/onboarding/OnboardingTypeSelector.tsx', [
  [/const isOttobon = brand === 'ottobon';/, "const isOttobon = false;"]
]);
replaceInFile('src/components/onboarding/WebsiteOnboardingWizard.tsx', [
  [/const isOttobon = brand === 'ottobon';/, "const isOttobon = false;"]
]);
replaceInFile('src/components/onboarding/WhatsAppAutomationOnboardingWizard.tsx', [
  [/const isOttobon = brand === 'ottobon';/, "const isOttobon = false;"]
]);
replaceInFile('src/app/[brand]/onboarding/[type]/GbpWizardWrapper.tsx', [
  [/const isOttobon = brand === 'ottobon';/g, "const isOttobon = false;"]
]);
replaceInFile('src/app/[brand]/onboarding/success/page.tsx', [
  [/const isOttobon = client\.onboarding_details\?\.brand === 'ottobon' \|\| client\.onboarding_details\?\.business_type === 'education' \|\| client\.onboarding_details\?\.business_type === 'Educational Institute';/, 'const isOttobon = false;']
]);
replaceInFile('src/app/[brand]/onboarding/page.tsx', [
  [/if \(brand !== 'medcy' && brand !== 'ottobon'\)/, "if (brand !== 'medcy')"]
]);
replaceInFile('src/app/[brand]/onboarding/[type]/page.tsx', [
  [/if \(brand !== 'medcy' && brand !== 'ottobon'\)/, "if (brand !== 'medcy')"],
  [/\/\/ Ottobon Specific Routes[\s\S]*?notFound\(\);\n}/, 'notFound();\n}']
]);

console.log('Medcy components isolated.');
