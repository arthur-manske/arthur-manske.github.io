const username = "arthur-manske";
const container = document.getElementById("projects-grid");

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
        const repos = await fetchAllRepos();
        const projects = repos.filter(repo => repo.topics.includes("portofolio"));

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
                if (imgRes.ok) {
                    finalImg = logoUrl;
                }
            } catch (err) {
                console.log(`Erro ao tentar logo em ${logoUrl}:`, err);
            }

            // usa homepage se disponível
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
        container.innerHTML = "<p>Erro ao carregar projetos.</p>";
    }
}

loadProjects();
