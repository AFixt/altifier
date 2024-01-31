document.addEventListener("DOMContentLoaded", function () {
  // Find all images without an alt attribute
  const imagesWithoutAlt = document.querySelectorAll("img:not([alt])");

  // Loop through each image to get send to the API
  imagesWithoutAlt.forEach((img) => {
    const imageUrl = img.src;

    // Send the image URL to the API
    axios
      .post("http://localhost:3000/", { url: imageUrl })
      .then((response) => {
        // Check if the API response has a caption
        if (
          response.data &&
          response.data.captionResult &&
          response.data.captionResult.text
        ) {
          // Set the alt attribute to the image
          img.alt = response.data.captionResult.text;
        } else {
          console.log("No caption found for image:", imageUrl);
        }
      })
      .catch((error) => {
        console.error("Error fetching image caption:", error);
      });
  });
});
