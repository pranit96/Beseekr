// src/utils/latexGenerator.ts

interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  summary?: string;
}

interface Experience {
  position?: string;
  company?: string;
  period?: string;
  location?: string;
  highlights?: string[];
}

interface SkillGroup {
  category?: string;
  items?: string[];
}

interface Education {
  institution?: string;
  degree?: string;
  period?: string;
  location?: string;
}

interface Project {
  name?: string;
  link?: string;
  description?: string;
  highlights?: string[];
}

interface ResumeData {
  personal_info?: PersonalInfo;
  experience?: Experience[];
  skills?: SkillGroup[];
  education?: Education[];
  projects?: Project[];
  certifications?: string[];
}

/**
 * Escapes special LaTeX characters to prevent compilation errors
 */
function escapeLatex(str: any): string {
  if (str === null || str === undefined) return "";
  const s = String(str).trim();
  if (!s) return "";

  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/**
 * Generates premium Jake's Resume style LaTeX code from structured resume JSON
 */
export function generateLatexResume(data: ResumeData): string {
  const info = data.personal_info || {};
  const experience = data.experience || [];
  const skills = data.skills || [];
  const education = data.education || [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];

  let latex = `\\documentclass[10pt, letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhdrstyle{} % clear headers/footers
\\fancyhf{} 
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-0.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(info.name || "Resume")}}\\\\ \\vspace{6pt}
`;

  // Contact info formatting
  const contactParts: string[] = [];
  if (info.phone) {
    contactParts.push(`\\small ${escapeLatex(info.phone)}`);
  }
  if (info.email) {
    contactParts.push(
      `\\href{mailto:${info.email}}{\\underline{${escapeLatex(info.email)}}}`,
    );
  }
  if (info.website) {
    let cleanWeb = info.website.replace(/^https?:\/\//i, "");
    contactParts.push(
      `\\href{${info.website}}{\\underline{${escapeLatex(cleanWeb)}}}`,
    );
  }
  if (info.location) {
    contactParts.push(`\\small ${escapeLatex(info.location)}`);
  }

  latex += `    ${contactParts.join(" $|$ \\\\\n    ")}\n\\end{center}\n\n`;

  // Professional Summary
  if (info.summary) {
    latex += `%-----------SUMMARY-----------
\\section{Professional Summary}
\\small{${escapeLatex(info.summary)}}
\\vspace{5pt}

`;
  }

  // Experience Section
  if (experience.length > 0) {
    latex += `%-----------EXPERIENCE-----------
\\section{Experience}
\\resumeSubHeadingListStart
`;

    experience.forEach((job) => {
      const pos = escapeLatex(job.position || "Position");
      const comp = escapeLatex(job.company || "Company");
      const per = escapeLatex(job.period || "Period");
      const loc = escapeLatex(job.location || "");

      latex += `  \\resumeSubheading{${pos}}{${per}}{${comp}}{${loc}}\n`;

      const highlights = job.highlights || [];
      if (highlights.length > 0) {
        latex += `  \\resumeItemListStart\n`;
        highlights.forEach((hl) => {
          if (hl && hl.trim()) {
            latex += `    \\resumeItem{${escapeLatex(hl)}}\n`;
          }
        });
        latex += `  \\resumeItemListEnd\n\n`;
      }
    });

    latex += `\\resumeSubHeadingListEnd\n\n`;
  }

  // Projects Section
  if (projects.length > 0) {
    latex += `%-----------PROJECTS-----------
\\section{Projects}
\\resumeSubHeadingListStart
`;

    projects.forEach((proj) => {
      const name = escapeLatex(proj.name || "Project");
      const link = proj.link
        ? ` $|$ \\href{${proj.link}}{\\underline{Link}}`
        : "";
      const desc = proj.description
        ? ` $|$ \\textit{${escapeLatex(proj.description)}}`
        : "";

      latex += `  \\resumeProjectHeading{\\textbf{${name}}${link}${desc}}{}\n`;

      const highlights = proj.highlights || [];
      if (highlights.length > 0) {
        latex += `  \\resumeItemListStart\n`;
        highlights.forEach((hl) => {
          if (hl && hl.trim()) {
            latex += `    \\resumeItem{${escapeLatex(hl)}}\n`;
          }
        });
        latex += `  \\resumeItemListEnd\n\n`;
      }
    });

    latex += `\\resumeSubHeadingListEnd\n\n`;
  }

  // Education Section
  if (education.length > 0) {
    latex += `%-----------EDUCATION-----------
\\section{Education}
\\resumeSubHeadingListStart
`;

    education.forEach((edu) => {
      const inst = escapeLatex(edu.institution || "University");
      const degree = escapeLatex(edu.degree || "Degree");
      const per = escapeLatex(edu.period || "Period");
      const loc = escapeLatex(edu.location || "");

      latex += `  \\resumeSubheading{${inst}}{${per}}{${degree}}{${loc}}\n`;
    });

    latex += `\\resumeSubHeadingListEnd\n\n`;
  }

  // Skills Section
  if (skills.length > 0) {
    latex += `%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{
`;

    const skillLines = skills.map((group) => {
      const cat = escapeLatex(group.category || "Skills");
      const items = (group.items || []).map(escapeLatex).join(", ");
      return `    \\textbf{${cat}}{: ${items}} \\\\`;
    });

    latex += skillLines.join("\n");
    latex += `\n  }}\n\\end{itemize}\n\n`;
  }

  // Certifications Section
  if (certifications.length > 0) {
    const validCerts = certifications
      .map((c) => String(c).trim())
      .filter(Boolean);
    if (validCerts.length > 0) {
      latex += `%-----------CERTIFICATIONS-----------
\\section{Certifications}
\\begin{itemize}[leftmargin=0.15in]
`;
      validCerts.forEach((cert) => {
        latex += `  \\item \\small{${escapeLatex(cert)}}\n`;
      });
      latex += `\\end{itemize}\n\n`;
    }
  }

  latex += `\\end{document}\n`;
  return latex;
}
