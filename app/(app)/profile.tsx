// ─── app/(app)/profile.tsx ───────────────────────────────────────────────────
// Full-featured profile page with:
//  • Hero banner with animated gradient + avatar upload
//  • Inline edit sheet for personal details
//  • Settings rows (notifications, security, appearance, etc.)
//  • Sign-out with confirmation
//  • Dark/light aware throughout

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput as RNTextInput,
  Switch,
  Alert,
  Platform,
  Dimensions,
  Modal,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeInUp,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import * as ImagePicker from "expo-image-picker";

import { Text } from "../../components/Text";
import { BottomSheet } from "../(app)/bottom-sheet";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  currency: string;
  avatarUri: string | null;
}

// ─── Avatar Component ────────────────────────────────────────────────────────
function AvatarRing({
  uri,
  name,
  size = 96,
  onPress,
}: {
  uri: string | null;
  name: string;
  size?: number;
  onPress?: () => void;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
    >
      {/* Animated ring */}
      <LinearGradient
        colors={["#60A5FA", "#3B82F6", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size + 6,
          height: size + 6,
          borderRadius: (size + 6) / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: size + 2,
            height: size + 2,
            borderRadius: (size + 2) / 2,
            backgroundColor: "transparent",
            borderWidth: 3,
            borderColor: "transparent",
          }}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 3,
                borderColor: "#fff",
              }}
            />
          ) : (
            <LinearGradient
              colors={["#1E40AF", "#3B82F6"]}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: size * 0.32,
                  fontWeight: "800",
                  color: "#fff",
                  letterSpacing: 1,
                }}
              >
                {initials || "?"}
              </Text>
            </LinearGradient>
          )}
        </View>
      </LinearGradient>

      {/* Camera badge */}
      {onPress && (
        <View style={styles.cameraBadge}>
          <LinearGradient
            colors={["#3B82F6", "#1D4ED8"]}
            style={styles.cameraBadgeGrad}
          >
            <Ionicons name="camera" size={12} color="#fff" />
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}

// ─── Edit Profile Sheet ───────────────────────────────────────────────────────
function EditProfileSheet({
  visible,
  onClose,
  profile,
  onSave,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (p: Partial<UserProfile>) => void;
  isDark: boolean;
}) {
  const [name,     setName]     = useState(profile.name);
  const [email,    setEmail]    = useState(profile.email);
  const [phone,    setPhone]    = useState(profile.phone);
  const [bio,      setBio]      = useState(profile.bio);
  const [currency, setCurrency] = useState(profile.currency);
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700)); // simulate API
    onSave({ name, email, phone, bio, currency });
    setSaving(false);
    onClose();
  };

  const inputStyle = [styles.input, isDark ? styles.inputDark : styles.inputLight];
  const labelStyle = [styles.fieldLabel, isDark && { color: "#94A3B8" }];

  const Field = ({
    label, value, onChange, placeholder, keyboardType, multiline, maxLength,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; keyboardType?: any; multiline?: boolean; maxLength?: number;
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={labelStyle}>{label}</Text>
      <RNTextInput
        style={[inputStyle, multiline && { height: 88, textAlignVertical: "top", paddingTop: 12 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={isDark ? "#334155" : "#94A3B8"}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        selectionColor="#3B82F6"
      />
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit Profile"
      subtitle="Update your personal details"
      icon="create-outline"
      accentColors={["#3B82F6", "#1D4ED8"]}
    >
      <Field label="Full Name"     value={name}     onChange={setName}     placeholder="Your full name" />
      <Field label="Email"         value={email}    onChange={setEmail}    placeholder="you@example.com" keyboardType="email-address" />
      <Field label="Phone"         value={phone}    onChange={setPhone}    placeholder="+254 700 000 000"  keyboardType="phone-pad" />
      <Field label="Bio"           value={bio}      onChange={setBio}      placeholder="A short intro…" multiline maxLength={120} />
      <Field label="Default Currency" value={currency} onChange={setCurrency} placeholder="KES" maxLength={3} />

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.saveBtnGrad}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </BottomSheet>
  );
}

// ─── Avatar Picker Sheet ──────────────────────────────────────────────────────
function AvatarPickerSheet({
  visible,
  onClose,
  onPickCamera,
  onPickGallery,
  onRemove,
  hasAvatar,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
  onRemove: () => void;
  hasAvatar: boolean;
  isDark: boolean;
}) {
  const OPTIONS = [
    { icon: "camera-outline",  label: "Take a photo",       color: "#3B82F6", onPress: onPickCamera },
    { icon: "images-outline",  label: "Choose from gallery", color: "#8B5CF6", onPress: onPickGallery },
    ...(hasAvatar
      ? [{ icon: "trash-outline", label: "Remove photo", color: "#EF4444", onPress: onRemove }]
      : []),
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Profile Photo"
      subtitle="Choose how to update your avatar"
      icon="person-circle-outline"
      accentColors={["#3B82F6", "#1D4ED8"]}
    >
      <View style={{ gap: 10, paddingBottom: 16 }}>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.label}
            onPress={() => { onClose(); setTimeout(opt.onPress, 300); }}
            style={({ pressed }) => [
              styles.avatarOption,
              isDark ? styles.avatarOptionDark : styles.avatarOptionLight,
              pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[styles.avatarOptionIcon, { backgroundColor: opt.color + "18" }]}>
              <Ionicons name={opt.icon as any} size={22} color={opt.color} />
            </View>
            <Text style={[styles.avatarOptionLabel, isDark && { color: "#E2E8F0" }]}>{opt.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? "#334155" : "#CBD5E1"} />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon, iconColor, iconBg, label, sublabel, value, onPress, toggle, danger, isDark,
}: {
  icon: string; iconColor: string; iconBg: string; label: string;
  sublabel?: string; value?: string; onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  danger?: boolean; isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!!toggle}
      style={({ pressed }) => [
        styles.settingsRow,
        isDark ? styles.settingsRowDark : styles.settingsRowLight,
        pressed && onPress && { opacity: 0.75, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.settingsInfo}>
        <Text style={[styles.settingsLabel, danger && { color: "#EF4444" }, isDark && !danger && { color: "#E2E8F0" }]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.settingsSub}>{sublabel}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ false: isDark ? "#1E293B" : "#E2E8F0", true: "#3B82F6" }}
          thumbColor="#fff"
        />
      ) : value ? (
        <Text style={styles.settingsValue}>{value}</Text>
      ) : onPress ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={danger ? "#EF4444" : isDark ? "#334155" : "#CBD5E1"}
        />
      ) : null}
    </Pressable>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <Text style={[styles.sectionTitle, isDark && { color: "#475569" }]}>{label}</Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex Kamau",
    email: "alex.kamau@gmail.com",
    phone: "+254 712 345 678",
    bio: "Building wealth, one shilling at a time. 🇰🇪",
    currency: "KES",
    avatarUri: null,
  });

  const [showEdit,         setShowEdit]         = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [notifs,           setNotifs]           = useState(true);
  const [biometric,        setBiometric]        = useState(false);
  const [budgetAlerts,     setBudgetAlerts]     = useState(true);

  // ── Avatar handling ──
  const requestPickImage = async (source: "camera" | "gallery") => {
    let permResult;
    if (source === "camera") {
      permResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permResult.status !== "granted") {
      Alert.alert("Permission needed", `Please allow ${source} access in Settings.`);
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled && result.assets[0]) {
      setProfile((p) => ({ ...p, avatarUri: result.assets[0].uri }));
    }
  };

  const handleSaveProfile = (updates: Partial<UserProfile>) => {
    setProfile((p) => ({ ...p, ...updates }));
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const joinDate = "Member since Jan 2024";
  const initials = profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <ScrollView
        style={[styles.screen, isDark ? styles.bgDark : styles.bgLight]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Banner ── */}
        <Animated.View entering={FadeIn.duration(500)}>
          <LinearGradient
            colors={isDark
              ? ["#0D1B2E", "#0A1628", "#020B18"]
              : ["#1E3A8A", "#2563EB", "#3B82F6"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, { paddingTop: insets.top + 20 }]}
          >
            {/* Decorative circles */}
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />
            <View style={styles.heroCircle3} />

            {/* Top row: back/settings */}
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => setShowEdit(true)}
                style={styles.heroEditBtn}
              >
                <Ionicons name="create-outline" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroEditBtnText}>Edit</Text>
              </Pressable>
            </View>

            {/* Avatar */}
            <View style={styles.heroAvatarRow}>
              <AvatarRing
                uri={profile.avatarUri}
                name={profile.name}
                size={96}
                onPress={() => setShowAvatarPicker(true)}
              />
              {/* Membership badge */}
              <View style={styles.memberBadge}>
                <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.memberBadgeGrad}>
                  <Ionicons name="star" size={10} color="#fff" />
                  <Text style={styles.memberBadgeText}>PRO</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Name & meta */}
            <Text style={styles.heroName}>{profile.name}</Text>
            <Text style={styles.heroEmail}>{profile.email}</Text>
            {profile.bio ? (
              <Text style={styles.heroBio}>"{profile.bio}"</Text>
            ) : null}
            <Text style={styles.heroJoined}>{joinDate}</Text>

            {/* Stats strip */}
            <View style={styles.heroStats}>
              {[
                { label: "Currency", value: profile.currency },
                { label: "Accounts", value: "3" },
                { label: "Streak",   value: "14d 🔥" },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <View style={styles.heroStatDivider} />}
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{s.value}</Text>
                    <Text style={styles.heroStatLabel}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Personal Info ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100).springify()} style={styles.section}>
          <SectionTitle label="Personal Info" isDark={isDark} />
          <View style={styles.infoCard}>
            {[
              { icon: "person-outline",  label: "Full Name",  value: profile.name },
              { icon: "mail-outline",    label: "Email",      value: profile.email },
              { icon: "call-outline",    label: "Phone",      value: profile.phone || "Not set" },
              { icon: "cash-outline",    label: "Currency",   value: profile.currency },
            ].map((item, i, arr) => (
              <View
                key={item.label}
                style={[
                  styles.infoRow,
                  isDark ? styles.infoRowDark : styles.infoRowLight,
                  i === arr.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.infoIconBg, isDark ? { backgroundColor: "rgba(59,130,246,0.12)" } : { backgroundColor: "rgba(59,130,246,0.08)" }]}>
                  <Ionicons name={item.icon as any} size={16} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={[styles.infoValue, isDark && { color: "#E2E8F0" }]}>{item.value}</Text>
                </View>
                <Pressable
                  onPress={() => setShowEdit(true)}
                  hitSlop={8}
                >
                  <Ionicons name="pencil" size={14} color={isDark ? "#334155" : "#CBD5E1"} />
                </Pressable>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Preferences ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(200).springify()} style={styles.section}>
          <SectionTitle label="Preferences" isDark={isDark} />
          <View style={styles.settingsGroup}>
            <SettingsRow
              icon="notifications-outline" iconColor="#3B82F6" iconBg="rgba(59,130,246,0.12)"
              label="Push Notifications" sublabel="Transaction alerts & reminders"
              toggle={{ value: notifs, onChange: setNotifs }} isDark={isDark}
            />
            <SettingsRow
              icon="alarm-outline" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.12)"
              label="Budget Alerts" sublabel="Warn when nearing limits"
              toggle={{ value: budgetAlerts, onChange: setBudgetAlerts }} isDark={isDark}
            />
            <SettingsRow
              icon={isDark ? "moon" : "sunny-outline"}
              iconColor={isDark ? "#8B5CF6" : "#F59E0B"}
              iconBg={isDark ? "rgba(139,92,246,0.12)" : "rgba(245,158,11,0.12)"}
              label="Appearance"
              value={isDark ? "Dark" : "Light"}
              onPress={toggleColorScheme}
              isDark={isDark}
            />
            <SettingsRow
              icon="language-outline" iconColor="#10B981" iconBg="rgba(16,185,129,0.12)"
              label="Language" value="English"
              onPress={() => {}} isDark={isDark}
            />
          </View>
        </Animated.View>

        {/* ── Security ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(300).springify()} style={styles.section}>
          <SectionTitle label="Security" isDark={isDark} />
          <View style={styles.settingsGroup}>
            <SettingsRow
              icon="finger-print-outline" iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.12)"
              label="Biometric Login" sublabel="Face ID / Fingerprint"
              toggle={{ value: biometric, onChange: setBiometric }} isDark={isDark}
            />
            <SettingsRow
              icon="lock-closed-outline" iconColor="#EF4444" iconBg="rgba(239,68,68,0.1)"
              label="Change PIN"
              onPress={() => {}} isDark={isDark}
            />
            <SettingsRow
              icon="shield-checkmark-outline" iconColor="#10B981" iconBg="rgba(16,185,129,0.12)"
              label="Two-Factor Auth" value="Enabled"
              onPress={() => {}} isDark={isDark}
            />
            <SettingsRow
              icon="eye-off-outline" iconColor="#64748B" iconBg="rgba(100,116,139,0.1)"
              label="Privacy Mode" sublabel="Hide balances on home screen"
              onPress={() => {}} isDark={isDark}
            />
          </View>
        </Animated.View>

        {/* ── Data & Account ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(400).springify()} style={styles.section}>
          <SectionTitle label="Data & Account" isDark={isDark} />
          <View style={styles.settingsGroup}>
            <SettingsRow
              icon="download-outline" iconColor="#3B82F6" iconBg="rgba(59,130,246,0.12)"
              label="Export Data" sublabel="Download CSV or PDF reports"
              onPress={() => {}} isDark={isDark}
            />
            <SettingsRow
              icon="cloud-upload-outline" iconColor="#10B981" iconBg="rgba(16,185,129,0.12)"
              label="Backup & Sync" value="Auto"
              onPress={() => {}} isDark={isDark}
            />
            <SettingsRow
              icon="help-circle-outline" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.12)"
              label="Help & Support"
              onPress={() => {}} isDark={isDark}
            />
            <SettingsRow
              icon="information-circle-outline" iconColor="#64748B" iconBg="rgba(100,116,139,0.1)"
              label="About" value="v1.0.0"
              onPress={() => {}} isDark={isDark}
            />
          </View>
        </Animated.View>

        {/* ── Sign Out ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(500).springify()} style={[styles.section, { marginBottom: 8 }]}>
          <View style={styles.settingsGroup}>
            <SettingsRow
              icon="log-out-outline" iconColor="#EF4444" iconBg="rgba(239,68,68,0.1)"
              label="Sign Out" danger
              onPress={handleSignOut} isDark={isDark}
            />
          </View>
        </Animated.View>

      </ScrollView>

      {/* ── Sheets ── */}
      <EditProfileSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        profile={profile}
        onSave={handleSaveProfile}
        isDark={isDark}
      />
      <AvatarPickerSheet
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onPickCamera={() => requestPickImage("camera")}
        onPickGallery={() => requestPickImage("gallery")}
        onRemove={() => setProfile((p) => ({ ...p, avatarUri: null }))}
        hasAvatar={!!profile.avatarUri}
        isDark={isDark}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1 },
  bgDark:  { backgroundColor: "#020B18" },
  bgLight: { backgroundColor: "#F1F5F9" },

  // Hero
  heroBanner: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    overflow: "hidden",
  },
  heroCircle1: {
    position: "absolute", top: -80, right: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroCircle2: {
    position: "absolute", bottom: -40, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroCircle3: {
    position: "absolute", top: 40, right: 60,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  heroEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroEditBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  heroAvatarRow: {
    alignItems: "flex-start",
    marginBottom: 16,
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
  },
  cameraBadgeGrad: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  memberBadge: {
    position: "absolute",
    top: -4,
    left: 82,
  },
  memberBadgeGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
    marginBottom: 6,
  },
  heroBio: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    fontStyle: "italic",
    marginBottom: 6,
    lineHeight: 19,
  },
  heroJoined: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 16,
  },
  heroStat: { flex: 1, alignItems: "center", gap: 4 },
  heroStatValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  heroStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 4,
  },

  // Info card
  infoCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRowLight: {
    backgroundColor: "#fff",
    borderBottomColor: "rgba(15,23,42,0.06)",
  },
  infoRowDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },

  // Settings
  settingsGroup: {},
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  settingsRowLight: {
    backgroundColor: "#fff",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsRowDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingsInfo: { flex: 1 },
  settingsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  settingsSub: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 2,
  },
  settingsValue: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "700",
  },

  // Avatar picker
  avatarOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  avatarOptionLight: {
    backgroundColor: "#fff",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarOptionDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  avatarOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOptionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  // Edit sheet
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
    borderWidth: 1.5,
  },
  inputLight: {
    backgroundColor: "#fff",
    borderColor: "rgba(15,23,42,0.1)",
    color: "#0F172A",
  },
  inputDark: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    color: "#F1F5F9",
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  saveBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4,
  },
  footerText:    { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
  footerVersion: { fontSize: 11, color: "#CBD5E1", fontWeight: "500" },
});