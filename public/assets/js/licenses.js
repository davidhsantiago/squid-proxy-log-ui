function loadModules() {
    fetch("/assets/etc/modules.json")
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const modulesList = document.getElementById("modules-list");
            modulesList.innerHTML = "";
            data.forEach(module => {
                const moduleName = Object.keys(module)[0];
                const moduleInfo = module[moduleName];
                const moduleElement = document.createElement("div");
                moduleElement.className = "module-entry";
                moduleElement.innerHTML = `
                    <h4 onclick="showModuleDetails('${moduleName}')">${moduleName}</h4>
                    <div class="module-details">
                        <p><strong>Version:</strong> ${moduleInfo.version}</p>
                        <p><strong>License:</strong> ${moduleInfo.license}</p>
                        <p><strong>Description:</strong> ${moduleInfo.description}</p>
                        ${moduleInfo.homepage !=="n/a" ? `<p><strong>Homepage:</strong> <a href="${moduleInfo.homepage}" target="_blank">${moduleInfo.homepage}</a></p>` : ""}
                        <p><strong>Author:</strong> ${moduleInfo.author}</p>
                        <p><button id="close-button" onclick="closeDetails()">Close <i class="bi bi-x"></i></button></p>
                    </div>
                `;
                modulesList.appendChild(moduleElement);
            });
        })
        .catch(error => {
            console.error("Error loading modules:", error);
        });
}

function showModuleDetails(moduleName) {
    const modulesList = document.getElementById("modules-list");
    const moduleElements = modulesList.getElementsByClassName("module-entry");
    for (const moduleElement of moduleElements) {
        const title = moduleElement.querySelector("h4").textContent;
        const details = moduleElement.querySelector(".module-details");
        if (title === moduleName) {
            moduleElement.style.display = "block";
            details.style.display = "block";
        } else {
            moduleElement.style.display = "none";
            details.style.display = "none";
        }
    }
}

function closeDetails() {
    const modulesList = document.getElementById("modules-list");
    const moduleElements = modulesList.getElementsByClassName("module-entry");
    for (const moduleElement of moduleElements) {
        const details = moduleElement.querySelector(".module-details");
        details.style.display = "none";
        moduleElement.style.display = "block";
    }
}

loadModules();
    