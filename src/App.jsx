import React, { useState, useEffect, useRef } from "react";
import {
    FaGithub,
    FaLinkedin,
    FaFacebook,
    FaMoon,
    FaSun,
    FaEnvelope,
    FaChevronLeft,
    FaChevronRight,
    FaHtml5,
    FaCss3Alt,
    FaReact,
    FaNode,
    FaAngular,
    FaBootstrap,
    FaSass,
    FaGitAlt,
    FaFigma,
    FaDatabase,
} from "react-icons/fa";
import {
    SiJavascript,
    SiTypescript,
    SiMysql,
    SiDotnet,
    SiTailwindcss,
    SiJquery,
    SiRedis,
    SiMongodb,
    SiAdobephotoshop,
} from "react-icons/si";
import { TbApi, TbBrandOpenai } from "react-icons/tb";
import { MdWindow } from "react-icons/md";
import avatar from "./assets/avatar.png";
import "./index.css";

const NAV_LINKS = [
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
];

function ThemeToggle({ darkMode, setDarkMode }) {
    return (
        <button
            className="bg-black/10 dark:bg-white/10 hover:bg-red-600/80 dark:hover:bg-red-600/80 backdrop-blur-md border border-black/20 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm shadow-lg"
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Toggle theme"
        >
            {darkMode ? <FaSun className="inline mr-2" /> : <FaMoon className="inline mr-2" />}
            {darkMode ? "Light" : "Dark"}
        </button>
    );
}

// Icon mapping cho skills - Sử dụng React Icons (SVG)
const getSkillIcon = (skill) => {
    const iconClass = "text-xl";

    switch (skill) {
        case "JavaScript":
            return <SiJavascript className={`${iconClass} text-yellow-400`} />;
        case "TypeScript":
            return <SiTypescript className={`${iconClass} text-blue-500`} />;
        case "C#":
            return <SiDotnet className={`${iconClass} text-purple-600`} />;
        case "HTML":
            return <FaHtml5 className={`${iconClass} text-orange-500`} />;
        case "CSS":
            return <FaCss3Alt className={`${iconClass} text-blue-500`} />;
        case "MySQL":
            return <SiMysql className={`${iconClass} text-blue-600`} />;
        case "Microsoft SQL Server":
            return <FaDatabase className={`${iconClass} text-red-600`} />;
        case "React.js":
            return <FaReact className={`${iconClass} text-cyan-400`} />;
        case ".NET Framework":
            return <SiDotnet className={`${iconClass} text-purple-600`} />;
        case "ASP.NET Web API":
            return <TbApi className={`${iconClass} text-purple-500`} />;
        case "ASP.NET MVC":
            return <SiDotnet className={`${iconClass} text-purple-600`} />;
        case "Blazor":
            return <SiDotnet className={`${iconClass} text-purple-500`} />;
        case "Entity Framework":
            return <FaDatabase className={`${iconClass} text-purple-400`} />;
        case "LINQ":
            return <SiDotnet className={`${iconClass} text-purple-500`} />;
        case "Node.js":
            return <FaNode className={`${iconClass} text-green-500`} />;
        case "AngularJS":
            return <FaAngular className={`${iconClass} text-red-600`} />;
        case "jQuery":
            return <SiJquery className={`${iconClass} text-blue-500`} />;
        case "Bootstrap":
            return <FaBootstrap className={`${iconClass} text-purple-600`} />;
        case "Tailwind CSS":
            return <SiTailwindcss className={`${iconClass} text-cyan-400`} />;
        case "SASS":
            return <FaSass className={`${iconClass} text-pink-400`} />;
        case "REST APIs":
            return <TbApi className={`${iconClass} text-blue-400`} />;
        case "JSON Web Token (JWT)":
            return <FaDatabase className={`${iconClass} text-pink-500`} />;
        case "Hangfire":
            return <FaDatabase className={`${iconClass} text-orange-500`} />;
        case "Windows Services":
            return <MdWindow className={`${iconClass} text-blue-500`} />;
        case "Redis":
            return <SiRedis className={`${iconClass} text-red-600`} />;
        case "Git":
            return <FaGitAlt className={`${iconClass} text-orange-600`} />;
        case "GitHub Copilot":
            return <FaGithub className={`${iconClass} text-gray-400`} />;
        case "ChatGPT":
            return <TbBrandOpenai className={`${iconClass} text-green-500`} />;
        case "DevExpress":
            return <FaDatabase className={`${iconClass} text-blue-500`} />;
        case "Flexcel":
            return <FaDatabase className={`${iconClass} text-green-500`} />;
        case "Figma":
            return <FaFigma className={`${iconClass} text-purple-500`} />;
        case "Adobe Photoshop":
            return <SiAdobephotoshop className={`${iconClass} text-blue-600`} />;
        case "MongoDB":
            return <SiMongodb className={`${iconClass} text-green-600`} />;
        default:
            return <FaDatabase className={`${iconClass} text-gray-400`} />; // Default icon cho skills chưa có
    }
};

const skills = {
    "Core Technologies": [
        "C#",
        ".NET Framework",
        "ASP.NET Web API",
        "ASP.NET MVC",
        "Blazor",
        "Entity Framework",
        "LINQ",
    ],
    Frontend: [
        "JavaScript",
        "HTML",
        "CSS",
        "AngularJS",
        "jQuery",
        "Bootstrap",
        "Tailwind CSS",
        "SASS",
    ],
    "Backend & APIs": [
        "REST APIs",
        "JSON Web Token (JWT)",
        "Hangfire",
        "Windows Services",
        "Redis",
    ],
    Databases: ["Microsoft SQL Server", "MySQL"],
    "Tools & DevOps": [
        "Git",
        "GitHub Copilot",
        "ChatGPT",
        "DevExpress",
        "Flexcel",
        "Figma",
        "Adobe Photoshop",
    ],
};

export default function App() {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme");
            if (saved === "dark") return true;
            if (saved === "light") return false;
            return false;
        }
        return false;
    });

    // Ref for projects scroll container
    const projectsScrollRef = useRef(null);

    const scrollProjects = (direction) => {
        if (projectsScrollRef.current) {
            const scrollAmount = 400; // Scroll 400px
            const newPosition =
                direction === "left"
                    ? projectsScrollRef.current.scrollLeft - scrollAmount
                    : projectsScrollRef.current.scrollLeft + scrollAmount;

            projectsScrollRef.current.scrollTo({
                left: newPosition,
                behavior: "smooth",
            });
        }
    };

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    // Projects fetch
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch(`https://api.github.com/users/tchiphuong/repos`)
            .then((res) => res.json())
            .then((data) => {
                setRepos(data);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-neutral-900 dark:to-black transition-colors duration-500">
            {/* Netflix-style Header với Glassmorphism */}
            <header className="w-full bg-black/5 dark:bg-white/5 backdrop-blur-xl border-b border-black/10 dark:border-white/10 shadow-lg py-4 px-6 flex items-center justify-between fixed top-0 left-0 z-50 transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
                    <div className="flex items-center gap-8">
                        <span className="text-3xl font-bold text-red-600 tracking-tight">
                            PHUONG
                        </span>
                        <nav className="hidden md:flex gap-6">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition font-medium text-sm"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/tchiphuong"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                        >
                            <FaGithub className="text-xl text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition" />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/tchiphuong/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                        >
                            <FaLinkedin className="text-xl text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition" />
                        </a>
                        <a
                            href="https://www.facebook.com/tchiphuong"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                        >
                            <FaFacebook className="text-xl text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition" />
                        </a>
                        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                    </div>
                </div>
            </header>
            {/* Netflix Hero Section - About */}
            <main className="flex-1 flex flex-col">
                {/* Hero Banner - Full Width như Netflix */}
                <section
                    id="about"
                    className="relative h-[80vh] md:h-[90vh] flex items-center justify-start px-4 md:px-16"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.4) 70%, transparent), url(${avatar})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center top",
                    }}
                >
                    {/* Content overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>

                    <div className="max-w-2xl relative z-10">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 text-white tracking-tight drop-shadow-2xl">
                            Phuong Tran
                        </h1>
                        <p className="text-2xl md:text-3xl text-red-600 font-bold mb-6 drop-shadow-lg">
                            Software Engineer
                        </p>
                        <p className="text-base md:text-lg text-gray-200 mb-8 leading-relaxed drop-shadow-md max-w-xl">
                            Building robust and scalable web applications with passion. Specializing
                            in React, .NET, and modern web technologies.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a
                                href="#projects"
                                className="px-8 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded flex items-center gap-2 transition-all shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                                View Projects
                            </a>
                            <a
                                href="#contact"
                                className="px-8 py-3 bg-gray-600/80 hover:bg-gray-500/80 text-white font-bold rounded transition-all backdrop-blur-sm"
                            >
                                More Info
                            </a>
                        </div>
                    </div>
                </section>
                {/* Skills Section - Netflix Row Style với Horizontal Scroll */}
                <section id="skills" className="py-16 px-4 md:px-16 bg-gray-50 dark:bg-black">
                    <div className="max-w-full">
                        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black dark:text-white">
                            Tech Stack
                        </h2>
                        <div className="space-y-8">
                            {Object.entries(skills).map(([category, items]) => (
                                <div key={category}>
                                    <h3 className="text-sm md:text-base font-semibold mb-4 text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        {category}
                                    </h3>

                                    <div className="flex flex-wrap gap-3">
                                        {items.map((skill) => {
                                            const icon = getSkillIcon(skill);
                                            return (
                                                <span
                                                    key={skill}
                                                    className="bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-105 flex items-center gap-2 shadow-lg hover:-translate-y-1"
                                                >
                                                    {icon && (
                                                        <span className="text-lg flex-shrink-0">
                                                            {icon}
                                                        </span>
                                                    )}
                                                    {skill}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                {/* Projects - Netflix Horizontal Carousel Style */}
                <section id="projects" className="py-16 px-4 md:px-16 bg-gray-50 dark:bg-black">
                    <div className="max-w-full">
                        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black dark:text-white">
                            Featured Projects
                        </h2>
                        {loading ? (
                            <div className="text-center text-gray-400 font-medium text-lg py-20">
                                Loading...
                            </div>
                        ) : (
                            <div className="relative group/projects">
                                {/* Left Arrow Button */}
                                <button
                                    onClick={() => scrollProjects("left")}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-md hover:bg-black/90 text-white p-3 rounded-full opacity-0 group-hover/projects:opacity-100 transition-all duration-300 shadow-xl border border-white/20 hover:scale-110"
                                    aria-label="Scroll left"
                                >
                                    <FaChevronLeft className="text-xl" />
                                </button>

                                {/* Right Arrow Button */}
                                <button
                                    onClick={() => scrollProjects("right")}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-md hover:bg-black/90 text-white p-3 rounded-full opacity-0 group-hover/projects:opacity-100 transition-all duration-300 shadow-xl border border-white/20 hover:scale-110"
                                    aria-label="Scroll right"
                                >
                                    <FaChevronRight className="text-xl" />
                                </button>

                                <div
                                    ref={projectsScrollRef}
                                    className="flex overflow-x-scroll gap-4 pb-8 pt-4 scrollbar-hide scroll-smooth -mx-4 px-4 md:-mx-16 md:px-16"
                                >
                                    {repos.map((repo, index) => (
                                        <a
                                            key={repo.id}
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative flex-shrink-0 w-72 md:w-80 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-visible transition-all duration-300 hover:scale-110 hover:z-10 hover:shadow-2xl"
                                        >
                                            {/* Card wrapper with overflow-hidden */}
                                            <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors">
                                                {/* Thumbnail - GitHub social preview or gradient fallback */}
                                                <div className="h-44 bg-gradient-to-br from-neutral-800 to-neutral-900 relative overflow-hidden">
                                                    {/* Try to load GitHub social preview image */}
                                                    <img
                                                        src={`https://opengraph.githubassets.com/1/${repo.full_name}`}
                                                        alt={repo.name}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                                                        onError={(e) => {
                                                            // Fallback to gradient with icon if image fails
                                                            e.target.style.display = "none";
                                                        }}
                                                    />
                                                    {/* Fallback icon (hidden if image loads) */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <FaGithub className="text-6xl text-neutral-700 group-hover:text-neutral-600 transition-colors" />
                                                    </div>
                                                    {/* Dark overlay gradient */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                                                    {repo.language && (
                                                        <span className="absolute top-3 right-3 bg-red-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                            {repo.language}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Info overlay - hiện khi hover */}
                                                <div className="p-4 bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition-colors">
                                                    <h3 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-red-500 transition-colors">
                                                        {repo.name}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                                        {repo.description ||
                                                            "No description available"}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span>⭐ {repo.stargazers_count || 0}</span>
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                                                            View →
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                {/* Contact Section */}
                <section
                    id="contact"
                    className="py-20 px-4 md:px-16 bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-neutral-900"
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black dark:text-white">
                                Let's Connect
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Have a project in mind or just want to say hi? Feel free to reach
                                out!
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Email Card */}
                            <a
                                href="mailto:tchiphuong@example.com"
                                className="group relative bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:border-red-600/50 dark:hover:border-red-600/50 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-red-600/10 rounded-2xl transition-all duration-300"></div>
                                <div className="relative">
                                    <div className="w-16 h-16 bg-red-600/10 dark:bg-red-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-all duration-300">
                                        <FaEnvelope className="text-2xl text-red-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                                        Email
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                                        tchiphuong@example.com
                                    </p>
                                </div>
                            </a>

                            {/* GitHub Card */}
                            <a
                                href="https://github.com/tchiphuong"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:border-red-600/50 dark:hover:border-red-600/50 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-red-600/10 rounded-2xl transition-all duration-300"></div>
                                <div className="relative">
                                    <div className="w-16 h-16 bg-red-600/10 dark:bg-red-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-all duration-300">
                                        <FaGithub className="text-2xl text-red-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                                        GitHub
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        @tchiphuong
                                    </p>
                                </div>
                            </a>

                            {/* LinkedIn Card */}
                            <a
                                href="https://www.linkedin.com/in/tchiphuong/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:border-red-600/50 dark:hover:border-red-600/50 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-red-600/10 rounded-2xl transition-all duration-300"></div>
                                <div className="relative">
                                    <div className="w-16 h-16 bg-red-600/10 dark:bg-red-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-all duration-300">
                                        <FaLinkedin className="text-2xl text-red-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                                        LinkedIn
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Phuong Tran
                                    </p>
                                </div>
                            </a>

                            {/* Facebook Card */}
                            <a
                                href="https://www.facebook.com/tchiphuong"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 hover:border-red-600/50 dark:hover:border-red-600/50 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-red-600/10 rounded-2xl transition-all duration-300"></div>
                                <div className="relative">
                                    <div className="w-16 h-16 bg-red-600/10 dark:bg-red-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-all duration-300">
                                        <FaFacebook className="text-2xl text-red-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                                        Facebook
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        @tchiphuong
                                    </p>
                                </div>
                            </a>
                        </div>
                    </div>
                </section>
            </main>
            {/* Netflix-style Footer */}
            <footer className="w-full bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-neutral-800 py-8 px-4 md:px-16">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                        <div>
                            <span className="text-xl font-bold text-red-600">PHUONG</span>
                        </div>
                        <div className="flex gap-6">
                            <a
                                href="https://github.com/tchiphuong"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-gray-300 transition text-sm"
                            >
                                GitHub
                            </a>
                            <a
                                href="https://www.linkedin.com/in/tchiphuong/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-gray-300 transition text-sm"
                            >
                                LinkedIn
                            </a>
                            <a
                                href="https://www.facebook.com/tchiphuong"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-gray-300 transition text-sm"
                            >
                                Facebook
                            </a>
                            <a
                                href="#about"
                                className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-gray-300 transition text-sm"
                            >
                                About
                            </a>
                            <a
                                href="#contact"
                                className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-gray-300 transition text-sm"
                            >
                                Contact
                            </a>
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-600 text-xs">
                        &copy; {new Date().getFullYear()} Phuong Tran. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
