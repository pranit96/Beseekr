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

  let latex = `\\documentclass[letterpaper,10.5pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage[english]{babel}
\\usepackage[T1]{fontenc}
\\usepackage{charter}
\\usepackage{xcolor}
\\usepackage{microtype}

\\definecolor{cvblue}{HTML}{0E5484}
\\definecolor{black}{HTML}{130810}
\\colorlet{name}{black}
\\colorlet{heading}{cvblue}

% Tight margins to fill full page
\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\textwidth}{1.2in}
\\addtolength{\\topmargin}{-0.88in}
\\addtolength{\\textheight}{1.76in}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\setlength{\\parskip}{0pt}

% Section formatting
\\titleformat{\\section}{
  \\vspace{-2pt}\\scshape\\raggedright\\large\\bfseries\\color{heading}
}{}{0em}{}[\\color{heading}\\titlerule\\vspace{-2pt}]
\\titlespacing\\section{0pt}{7pt}{5pt}

% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{#1\\vspace{1pt}}
}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{4pt}
  \\textbf{#1} \\hfill \\textit{\\small #4} \\\\
  \\textit{\\small #2, #3}
  \\vspace{-1pt}
}
\\newcommand{\\resumeProjectHeading}[3]{
  \\vspace{3pt}
  \\textbf{#1} \\; {\\small #2} \\\\[1.5pt]
  {\\footnotesize\\textbf{\\textcolor{cvblue!80!black}{Tech:}} \\; \\textcolor{black!65}{#3}}
  \\vspace{-2pt}
}

\\begin{document}

%---------- HEADING ----------
\\begin{center}
  {\\huge \\color{name}\\textbf{${escapeLatex(info.name || "Resume")}} } \\\\[3pt]
`;

  // Contact info formatting
  const contactParts: string[] = [];
  if (info.phone) {
    contactParts.push(`${escapeLatex(info.phone)}`);
  }
  if (info.email) {
    contactParts.push(
      `\\href{mailto:${info.email}}{\\color{cvblue}${escapeLatex(info.email)}}`,
    );
  }
  if (info.website) {
    let cleanWeb = info.website.replace(/^https?:\/\//i, "");
    contactParts.push(
      `\\href{${info.website}}{\\color{cvblue}${escapeLatex(cleanWeb)}}`,
    );
  }
  if (info.location) {
    contactParts.push(`${escapeLatex(info.location)}`);
  }

  // Custom Fields formatting
  const customFields = (info as any).custom_fields || [];
  customFields.forEach((cf: any) => {
    if (cf && cf.value) {
      const valStr = String(cf.value);

      if (cf.type === "text") {
        const labelPrefix = cf.label ? `${cf.label}: ` : "";
        contactParts.push(`${escapeLatex(labelPrefix)}${escapeLatex(valStr)}`);
      } else if (cf.type === "email") {
        contactParts.push(
          `\\href{mailto:${valStr}}{\\color{cvblue}${escapeLatex(valStr)}}`,
        );
      } else if (cf.type === "link") {
        let url = valStr;
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }
        const text = cf.label
          ? String(cf.label)
          : valStr.replace(/^https?:\/\//i, "");
        contactParts.push(
          `\\href{${url}}{\\color{cvblue}${escapeLatex(text)}}`,
        );
      } else {
        // Fallback auto-detection if type not specified
        const labelPrefix = cf.label ? `${cf.label}: ` : "";
        const isEmail = valStr.includes("@");
        const isLink =
          /^https?:\/\//i.test(valStr) ||
          /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(
            valStr,
          );

        if (isEmail) {
          contactParts.push(
            `\\href{mailto:${valStr}}{\\color{cvblue}${escapeLatex(valStr)}}`,
          );
        } else if (isLink) {
          let url = valStr;
          if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
          }
          const text = cf.label
            ? String(cf.label)
            : valStr.replace(/^https?:\/\//i, "");
          contactParts.push(
            `\\href{${url}}{\\color{cvblue}${escapeLatex(text)}}`,
          );
        } else {
          contactParts.push(
            `${escapeLatex(labelPrefix)}${escapeLatex(valStr)}`,
          );
        }
      }
    }
  });

  latex += `  {\\small\n    ${contactParts.join(" \\; $|$ \\; \n    ")}\n  }\n\\end{center}\n\n\\vspace{-6pt}\n\n`;

  // Professional Summary
  if (info.summary) {
    latex += `%---------- SUMMARY ----------
\\section{Professional Summary}
\\begin{itemize}[noitemsep, topsep=2pt, leftmargin=0.15in]
  \\resumeItem{${escapeLatex(info.summary)}}
\\end{itemize}
\\vspace{-2pt}

`;
  }

  // Skills Section
  if (skills.length > 0) {
    latex += `%---------- SKILLS ----------
\\section{Technical Skills}
\\begin{itemize}[noitemsep, topsep=2pt, leftmargin=0.15in]
`;
    skills.forEach((group) => {
      const cat = escapeLatex(group.category || "Skills");
      const items = (group.items || []).map(escapeLatex).join(", ");
      latex += `  \\resumeItem{\\textbf{${cat}:} ${items}}\n`;
    });

    latex += `\\end{itemize}\n\\vspace{-2pt}\n\n`;
  }

  // Experience Section
  if (experience.length > 0) {
    latex += `%---------- EXPERIENCE ----------
\\section{Experience}

`;
    experience.forEach((job) => {
      const pos = escapeLatex(job.position || "Position");
      const comp = escapeLatex(job.company || "Company");
      const per = escapeLatex(job.period || "Period");
      const loc = escapeLatex(job.location || "");

      latex += `\\resumeSubheading{${pos}}{${comp}}{${loc}}{${per}}\n`;

      const highlights = job.highlights || [];
      if (highlights.length > 0) {
        latex += `\\begin{itemize}[noitemsep, topsep=3pt, leftmargin=0.2in]\n`;
        highlights.forEach((hl) => {
          if (hl && hl.trim()) {
            latex += `  \\resumeItem{${escapeLatex(hl)}}\n`;
          }
        });
        latex += `\\end{itemize}\n\n`;
      }
    });

    latex += `\\vspace{-2pt}\n\n`;
  }

  // Projects Section
  if (projects.length > 0) {
    latex += `%---------- PROJECTS ----------
\\section{Projects}

`;
    projects.forEach((proj) => {
      const name = escapeLatex(proj.name || "Project");
      let linkParam = "";
      if (proj.link) {
        const linkText = proj.link.includes("github.com")
          ? "[GitHub]"
          : "[Link]";
        linkParam = `\\href{${proj.link}}{\\color{cvblue}${linkText}}`;
      }
      let cleanDesc = (proj.description || "").trim();
      if (cleanDesc.endsWith(".")) {
        cleanDesc = cleanDesc.slice(0, -1).trim();
      }
      const techStack = escapeLatex(cleanDesc);

      latex += `\\resumeProjectHeading{${name}}{${linkParam}}{${techStack}}\n`;

      const highlights = proj.highlights || [];
      if (highlights.length > 0) {
        latex += `\\begin{itemize}[noitemsep, topsep=2pt, leftmargin=0.2in]\n`;
        highlights.forEach((hl) => {
          if (hl && hl.trim()) {
            latex += `  \\resumeItem{${escapeLatex(hl)}}\n`;
          }
        });
        latex += `\\end{itemize}\n\n`;
      }
    });

    latex += `\\vspace{-2pt}\n\n`;
  }

  // Education Section
  if (education.length > 0) {
    latex += `%---------- EDUCATION ----------
\\section{Education}
\\vspace{2pt}
`;
    education.forEach((edu, idx) => {
      const inst = escapeLatex(edu.institution || "University");
      const degree = escapeLatex(edu.degree || "Degree");
      const per = escapeLatex(edu.period || "Period");
      const loc = escapeLatex(edu.location || "");

      const instLoc = loc ? `${inst}, ${loc}` : inst;

      latex += `\\textbf{${degree}} \\hfill \\textit{${per}} \\\\\n`;
      latex += `\\textit{${instLoc}}\n`;

      if (idx < education.length - 1) {
        latex += `\\vspace{4pt}\n\n`;
      }
    });

    latex += `\n\\vspace{-2pt}\n\n`;
  }

  // Certifications Section
  if (certifications.length > 0) {
    const validCerts = certifications
      .map((c) => String(c).trim())
      .filter(Boolean);
    if (validCerts.length > 0) {
      latex += `%---------- CERTIFICATIONS ----------
\\section{Key Achievements \\& Awards}
\\begin{itemize}[noitemsep, topsep=2pt, leftmargin=0.15in]
`;
      validCerts.forEach((cert) => {
        latex += `  \\resumeItem{${escapeLatex(cert)}}\n`;
      });
      latex += `\\end{itemize}\n\n`;
    }
  }

  latex += `\\end{document}\n`;
  return latex;
}
