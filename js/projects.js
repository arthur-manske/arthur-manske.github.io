const username = "arthur-manske";
const container = document.getElementById("projects-grid");
const CACHE_KEY = "projects-cache";
const CACHE_TTL = 1000 * 60 * 30; // 30 min

async function fetchAllRepos() {
    const allRepos = [];
    let page = 1;

    while (true) {
        try {
            const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}`);
            
            if (res.status === 403) {
                throw new Error("GitHub API Rate Limit exceeded. Please try again later.");
            }
            if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

            const repos = await res.json();
            if (repos.length === 0) break;

            allRepos.push(...repos);
            page++;
        } catch (e) {
            throw e;
        }
    }

    return allRepos;
}

async function fetchProjectMetadata(repo) {
    const branches = [repo.default_branch, "main", "master"].filter(Boolean);
    
    for (const branch of branches) {
        const metadataUrl = `https://raw.githubusercontent.com/${username}/${repo.name}/${branch}/.portfolio.json`;
        try {
            // Pequeno delay para evitar Rate Limit do GitHub Raw
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const res = await fetch(metadataUrl);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.log(`Network error fetching metadata for ${repo.name} on ${branch}. URL: ${metadataUrl}`);
        }
    }
    return null;
}

async function loadProjects() {
    try {
        let repos = [];
        const cache = localStorage.getItem(CACHE_KEY);
        const cacheTime = localStorage.getItem(`${CACHE_KEY}-time`);

        if (cache && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
            repos = JSON.parse(cache);
        } else {
            repos = await fetchAllRepos();
            localStorage.setItem(CACHE_KEY, JSON.stringify(repos));
            localStorage.setItem(`${CACHE_KEY}-time`, Date.now());
        }

        const projects = repos.filter(
            repo => Array.isArray(repo.topics) && repo.topics.includes("portofolio")
        );

        if (projects.length === 0) {
            document.getElementById("projects")?.remove();
            document.getElementById("separator")?.remove();
            return;
        }

        const lang = window.i18n ? window.i18n.getCurrentLang() : 'pt';

        for (const repo of projects) {
            // 1. Try to get Advanced Metadata
            const metadata = await fetchProjectMetadata(repo);
            
            // 2. Resolve Description
            let finalDescription = repo.description || "Sem descrição.";
            if (metadata && metadata.description) {
                finalDescription = metadata.description[lang] || metadata.description['en'] || metadata.description['pt'] || finalDescription;
            }

            // 3. Resolve Logo
            const logoUrl = `https://raw.githubusercontent.com/${username}/${repo.name}/${repo.default_branch || "master"}/assets/.logo-portofolio.jpeg`;
            let finalImg = repo.owner.avatar_url;

            try {
                const imgRes = await fetch(logoUrl, { method: "HEAD" });
                if (imgRes.ok) finalImg = logoUrl;
            } catch {}

            // 4. Resolve Link
            const projectLink = (metadata && metadata.demo) 
                ? metadata.demo 
                : (repo.homepage && repo.homepage.trim() !== "" ? repo.homepage : repo.html_url);

            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `
                <img src="${finalImg}" alt="Imagem do projeto">
                <h3>${repo.name}</h3>
                <p class="description">${finalDescription}</p>
                <a href="${projectLink}" target="_blank" class="btn">Ver projeto</a>
            `;
            container.appendChild(div);
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = `<p> :&#47; Infelizmente, ocorreu uma falha ao acessar os projetos por meio da GitHub API.<br> Tente acessar os projetos diretamente por <a href="https://github.com/${username}/"> ${username}</a> </p>`;
    }
}

// Ensure i18n is ready before loading projects
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
} else {
    loadProjects();
}
