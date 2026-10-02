const formData = new FormData();
formData.append("name", "Test Business");
formData.append("email", "test@gmail.com");
formData.append("isRegistered", "false");

fetch("http://localhost:4000/api/v1/business/register", {
  method: "POST",
  body: formData
}).then(res => res.json().then(data => console.log(res.status, data)));
