const username = "arthur-manske";
const container = document.getElementById("projects-grid");
const CACHE_KEY = "projects-cache";
const CACHE_TTL = 1000 * 60 * 30; // 30 min

async function fetchAllRepos() {
    const allRepos = [];
    let page = 1;

    while (true) {
        const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}`);
	if (!res.ok) throw new Error("Erro ao acessar GitHub API");

        const repos = await res.json();
        if (repos.length === 0) break;

        allRepos.push(...repos);
        page++;
    }

    return allRepos;
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

        for (const repo of projects) {
            const logoUrl = `https://raw.githubusercontent.com/${username}/${repo.name}/master/assets/.logo-portofolio.jpeg`;
            let finalImg = repo.owner.avatar_url;

            try {
                const imgRes = await fetch(logoUrl, { method: "HEAD" });
                if (imgRes.ok) finalImg = logoUrl;
            } catch {}

            const projectLink = repo.homepage && repo.homepage.trim() !== ""
                ? repo.homepage
                : repo.html_url;

            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `
                <img src="${finalImg}" alt="Imagem do projeto">
                <h3>${repo.name}</h3>
                <p class="description">${repo.description || "Sem descrição."}</p>
                <a href="${projectLink}" target="_blank" class="btn">Ver projeto</a>
            `;
            container.appendChild(div);
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = `<p> :&#47; Infelizmente, ocorreu uma falha ao acessar os projetos por meio da GitHub API.<br> Tente acessar os projetos diretamente por <a href="https://github.com/${username}/"> ${username}</a> </p>`;
    }
}

loadProjects();
