const bcrypt = require("bcrypt");
const supabase = require("../../supabaseClient");

function isBcryptHash(str) {
  return typeof str === "string" && /^\$2[aby]\$/.test(str);
}

/**
 * Login handler - supports:
 *  - bcrypt-hashed passwords
 *  - legacy/plaintext passwords (will re-hash on successful login)
 */
const facultyLogin = async (req, res) => {
  try {
    let { username = "", password = "" } = req.body;

    // normalize / trim (be consistent with registration below)
    username = String(username).trim();
    password = String(password).trim();

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Missing username or password" });
    }

    const { data: user, error: fetchErr } = await supabase
      .from("faculty_login")
      .select("*")
      .eq("username", username)
      .single();

    if (fetchErr || !user) {
      return res.json({ success: false, message: "No user found" });
    }

    const stored = user.password;
    if (!stored) {
      return res.json({ success: false, message: "No password set for this user" });
    }

    // If stored password looks like a bcrypt hash -> use bcrypt.compare
    if (isBcryptHash(stored)) {
      const match = await bcrypt.compare(password, stored);
      if (!match) {
        return res.json({ success: false, message: "Incorrect password" });
      }
      return res.json({ success: true, facultyName: user.username });
    }

    // Fallback: stored password isn't bcrypt (maybe plaintext or other format)
    // Compare directly; if matches, re-hash and update DB to bcrypt for security.
    if (password === String(stored)) {
      try {
        const newHash = await bcrypt.hash(password, 10);
        await supabase
          .from("faculty_login")
          .update({ password: newHash })
          .eq("username", username);
        console.log(`Migrated plaintext password -> bcrypt for user ${username}`);
      } catch (updErr) {
        console.warn("Failed to update password hash after plaintext login:", updErr.message || updErr);
        // proceed anyway (we authenticated successfully)
      }
      return res.json({ success: true, facultyName: user.username });
    }

    return res.json({ success: false, message: "Incorrect password" });
  } catch (err) {
    console.error("facultyLogin error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Register handler - trims inputs, hashes password once, stores reset answer as plain text.
 * Make sure frontend also trims (example below) so there's no trailing/leading whitespace mismatch.
 */
const facultyRegister = async (req, res) => {
  try {
    let {
      username = "",
      email = "",
      password = "",
      confirmPassword = "",
      reset_qn = "",
      reset_ans = "",
    } = req.body;

    // normalize & trim
    username = String(username).trim();
    email = String(email).trim().toLowerCase();
    password = String(password);
    confirmPassword = String(confirmPassword);
    reset_qn = String(reset_qn).trim();
    reset_ans = String(reset_ans).trim();

    if (!username || !email || !password || !confirmPassword || !reset_qn || !reset_ans) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.json({ success: false, message: "Passwords do not match" });
    }

    // Make sure we don't double-hash if someone accidentally sends hashed password from client.
    // We assume the client sends plain password, so always hash on server.
    const { data: existingUser } = await supabase
      .from("faculty_login")
      .select("username,user_email")
      .or(`username.eq.${username},user_email.eq.${email}`);

    if (existingUser && existingUser.length > 0) {
      return res.json({ success: false, message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error: insertErr } = await supabase.from("faculty_login").insert([
      {
        username,
        user_email: email,
        password: hashedPassword,
        reset_qn,
        reset_ans, // stored as plain text (by your choice)
      },
    ]);

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return res.status(500).json({ success: false, message: "Failed to register" });
    }

    return res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("facultyRegister error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const findUser = async (req, res) => {
  try {
    const { username, email } = req.body;

    console.log("👉 Incoming findUser request:");
    console.log("username:", username);
    console.log("email:", email);

    let query = supabase.from("faculty_login").select("username, user_email, reset_qn").limit(1);

    if (username) query = query.eq("username", username);
    if (email) query = query.eq("user_email", email);

    const { data, error } = await query.single();

    console.log("👉 Supabase response:");
    console.log("error:", error);
    console.log("data:", data);

    if (error || !data) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, reset_qn: data.reset_qn });
  } catch (err) {
    console.error("❌ Server exception:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyAnswer = async (req, res) => {
  try {
    const { username, email, reset_ans } = req.body;

    const { data, error } = await supabase
      .from("faculty_login")
      .select("reset_ans")
      .or(`${username ? `username.eq.${username.trim()}` : ""},${email ? `user_email.eq.${email.trim()}` : ""}`)
      .single();

    if (error || !data) return res.json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(reset_ans.trim(), data.reset_ans);
    if (!match) return res.json({ success: false, message: "Incorrect answer" });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===== UPDATE PASSWORD (Step 3) =====
const updatePassword = async (req, res) => {
  try {
    const { username, email, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const query = supabase.from("faculty_login").update({ password: hashedPassword });
    if (username) query.eq("username", username.trim());
    if (email) query.eq("user_email", email.trim());

    const { error } = await query;

    if (error) return res.json({ success: false, message: "Failed to update password" });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  facultyLogin,
  facultyRegister,
  findUser,
  verifyAnswer,
  updatePassword,
};