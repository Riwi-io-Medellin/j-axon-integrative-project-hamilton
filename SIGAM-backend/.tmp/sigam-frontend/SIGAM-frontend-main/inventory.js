const form = document.getElementById("assetForm")

form.addEventListener("submit", function(e){

e.preventDefault()

const newAsset = {

name: document.getElementById("name").value,
id: "AST-" + (assets.length + 1).toString().padStart(3,"0"),
brand: document.getElementById("brand").value,
serial: document.getElementById("serial").value,
assigned: document.getElementById("assigned").value,
location: document.getElementById("location").value,
status: document.getElementById("status").value,
type: document.getElementById("type").value,
warranty: document.getElementById("warranty").value

}

assets.push(newAsset)

renderAssets(assets)

form.reset()

const modal = bootstrap.Modal.getInstance(document.getElementById("assetModal"))
modal.hide()

})