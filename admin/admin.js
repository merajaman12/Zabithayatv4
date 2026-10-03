const { createClient } = window.supabase;

const sb = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const $ = id => document.getElementById(id);

let settings;


async function isAdmin() {
  const {
    data: { user }
  } = await sb.auth.getUser();

  if (!user) return false;

  const { data } = await sb
    .from("admins")
    .select("enabled")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  return !!data;
}


async function boot() {
  if (await isAdmin()) {
    showPanel();
  } else {
    showLogin();
  }

  const {
    data: { subscription }
  } = sb.auth.onAuthStateChange(async () => {
    if (await isAdmin()) {
      showPanel();
    } else {
      showLogin();
    }
  });

  window.sub = subscription;
}


function showLogin() {
  $("login").classList.remove("hidden");
  $("panel").classList.add("hidden");
}


async function showPanel() {
  $("login").classList.add("hidden");
  $("panel").classList.remove("hidden");

  await loadSettings();
  await loadPosts();
}


$("loginBtn").onclick = async () => {
  const {
    error
  } = await sb.auth.signInWithPassword({
    email: $("email").value,
    password: $("password").value
  });

  $("loginMsg").textContent =
    error ? error.message : "Signed in.";
};


$("logout").onclick = () => sb.auth.signOut();


async function loadSettings() {

  const {
    data
  } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .single();

  settings = data || {};

  const fields = [
    ["siteName", "site_name"],
    ["description", "description"],
    ["purchaseTitle", "purchase_title"],
    ["purchaseDescription", "purchase_description"],
    ["purchaseLink", "purchase_link"],
    ["telegram", "telegram"],
    ["pinterest", "pinterest"],
    ["vk", "vk"],
    ["facebook", "facebook"]
  ];

  for (const [id, key] of fields) {
    $(id).value = settings[key] || "";
  }
}


$("saveSettings").onclick = async () => {

  const row = {
    id: true,
    site_name: $("siteName").value,
    description: $("description").value,
    purchase_title: $("purchaseTitle").value,
    purchase_description: $("purchaseDescription").value,
    purchase_link: $("purchaseLink").value,
    telegram: $("telegram").value,
    pinterest: $("pinterest").value,
    vk: $("vk").value,
    facebook: $("facebook").value,
    updated_at: new Date().toISOString()
  };

  const {
    error
  } = await sb
    .from("site_settings")
    .upsert(row);

  $("saveMsg").textContent =
    error ? error.message : "Saved.";
};


async function loadPosts() {

  const {
    data
  } = await sb
    .from("posts")
    .select("*")
    .order("slot");

  $("posts").innerHTML =
    (data || [])
      .map(p => `

        <article
          class="post"
          data-id="${p.id}"
        >

          <div class="posttop">

            <b>
              POST ${String(p.slot).padStart(2, "0")}
            </b>

            <label>
              <input
                class="published"
                type="checkbox"
                ${p.published ? "checked" : ""}
              >
              Published
            </label>

          </div>


          <div class="postgrid">

            <label>
              Title

              <input
                class="title"
                value="${esc(p.title)}"
              >
            </label>


            <label>
              Link

              <input
                class="link"
                value="${esc(p.link)}"
              >
            </label>

          </div>


          <label>
            Description

            <textarea
              class="desc"
              rows="3"
            >${esc(p.description)}</textarea>

          </label>


          ${
            p.media_url
              ? (
                  p.media_type === "video"
                    ? `
                      <video
                        class="media"
                        controls
                        src="${esc(p.media_url)}"
                      ></video>
                    `
                    : `
                      <img
                        class="media"
                        src="${esc(p.media_url)}"
                      >
                    `
                )
              : ""
          }


          <label>

            Upload image/video

            <input
              class="file"
              type="file"
              accept="image/*,video/*"
            >

          </label>


          <button class="savePost">
            Save post
          </button>

          <span class="msg"></span>

        </article>

      `)
      .join("");


  document
    .querySelectorAll(".savePost")
    .forEach(
      b => b.onclick = savePost
    );
}


function esc(s) {

  return String(s ?? "")
    .replace(
      /[&<>"']/g,
      m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m])
    );
}


async function savePost(e) {

  const card =
    e.currentTarget.closest(".post");

  const id =
    card.dataset.id;

  const file =
    card.querySelector(".file").files[0];


  let media_url = null;
  let media_type = null;
  let media_path = null;


  const {
    data: old
  } = await sb
    .from("posts")
    .select(
      "media_url,media_type,media_path"
    )
    .eq("id", id)
    .single();


  media_url =
    old?.media_url || null;

  media_type =
    old?.media_type || null;

  media_path =
    old?.media_path || null;


  if (file) {

    const ext =
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    const path =
      `${crypto.randomUUID()}.${ext}`;


    const {
      error
    } = await sb
      .storage
      .from("media")
      .upload(
        path,
        file,
        {
          upsert: false,
          contentType: file.type
        }
      );


    if (error) {

      card.querySelector(".msg")
        .textContent =
        error.message;

      return;
    }


    const {
      data: pub
    } = sb
      .storage
      .from("media")
      .getPublicUrl(path);


    media_url =
      pub.publicUrl;

    media_type =
      file.type.startsWith("video/")
        ? "video"
        : "image";

    media_path =
      path;
  }


  const row = {

    title:
      card.querySelector(".title").value,

    description:
      card.querySelector(".desc").value,

    link:
      card.querySelector(".link").value,

    published:
      card.querySelector(".published").checked,

    media_url,
    media_type,
    media_path,

    updated_at:
      new Date().toISOString()
  };


  const {
    error
  } = await sb
    .from("posts")
    .update(row)
    .eq("id", id);


  card.querySelector(".msg")
    .textContent =
    error
      ? error.message
      : "Saved.";


  if (!error) {
    await loadPosts();
  }
}


boot();
