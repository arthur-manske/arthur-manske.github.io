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
                throw new Error("GitHub API Rate Limit exceeded. Please try again later or check your profile on GitHub.");
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
            await new Promise(resolve => setTimeout(resolve, 100));
            const res = await fetch(metadataUrl);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            // Silent fail for metadata
        }
    }
    return null;
}

async function loadProjects() {
    try {
        let repos = [];
        let cache = null;
        let cacheTime = null;

        try {
            cache = localStorage.getItem(CACHE_KEY);
            cacheTime = localStorage.getItem(`${CACHE_KEY}-time`);
        } catch (e) {}

        if (cache && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
            repos = JSON.parse(cache);
        } else {
            repos = await fetchAllRepos();
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(repos));
                localStorage.setItem(`${CACHE_KEY}-time`, Date.now());
            } catch (e) {}
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

        // Clear container before appending to avoid duplication on lang change
        if (container) container.innerHTML = "";

        for (const repo of projects) {
            const metadata = await fetchProjectMetadata(repo);
            
            let finalDescription = repo.description || "Sem descrição.";
            if (metadata && metadata.description) {
                finalDescription = metadata.description[lang] || metadata.description['en'] || metadata.description['pt'] || finalDescription;
            }

            const logoUrl = `https://raw.githubusercontent.com/${username}/${repo.name}/${repo.default_branch || "master"}/assets/.logo-portofolio.jpeg`;
            let finalImg = repo.owner.avatar_url;

            try {
                const imgRes = await fetch(logoUrl, { method: "HEAD" });
                if (imgRes.ok) finalImg = logoUrl;
            } catch {}

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
        console.error("Project load error:", e);
        if (container) {
            container.innerHTML = `<p> :&#47; ${e.message || "Ocorreu uma falha ao acessar a API do GitHub."}<br> Tente acessar os projetos diretamente por <a href="https://github.com/${username}/"> ${username}</a> </p>`;
        }
    }
}

// We wait for i18n to be ready
window.addEventListener('load', () => {
    loadProjects();
});
