import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AppTheme, Member, ClassRole } from "../types";
import { getInitials, ROLE_META } from "../constants";

// ─── BTN ──────────────────────────────────────────────────────────────────────
export function Btn({children,variant="primary",size="md",onPress,disabled,loading,full,th,iconName}:{
  children:string;variant?:"primary"|"secondary"|"ghost"|"danger";size?:"sm"|"md"|"lg";
  onPress?:()=>void;disabled?:boolean;loading?:boolean;full?:boolean;th:AppTheme;iconName?:string;
}) {
  const H={sm:34,md:46,lg:54}[size];
  const FS={sm:13,md:14,lg:15}[size];
  const PX={sm:14,md:20,lg:24}[size];
  const R={sm:10,md:14,lg:16}[size];
  const bg={primary:th.orange,secondary:th.card,ghost:th.orangeLight,danger:"rgba(239,68,68,0.08)"}[variant];
  const fc={primary:"#fff",secondary:th.fg,ghost:th.orange,danger:"#ef4444"}[variant];
  const bc={primary:undefined,secondary:th.border,ghost:"rgba(228,130,46,0.4)",danger:"rgba(239,68,68,0.25)"}[variant];
  const bw={primary:0,secondary:1.5,ghost:1.5,danger:1}[variant];
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled||loading} activeOpacity={0.75}
      style={[{height:H,paddingHorizontal:PX,borderRadius:R,backgroundColor:bg,
        flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,
        width:full?"100%":undefined,
        borderWidth:bw,borderColor:bc},
        variant==="primary"&&!disabled?{shadowColor:th.orange,shadowOffset:{width:0,height:2},shadowOpacity:0.3,shadowRadius:8,elevation:4}:null,
        disabled?{opacity:0.5}:null]}>
      {loading
        ? <ActivityIndicator size="small" color={fc}/>
        : <>
            {iconName&&<Ionicons name={iconName as any} size={(FS??14)+1} color={disabled?th.muted:fc}/>}
            <Text style={{fontSize:FS,fontWeight:"700",color:disabled?th.muted:fc}}>{children}</Text>
          </>}
    </TouchableOpacity>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
export function Badge({color,bg,children}:{color:string;bg:string;children:string}) {
  return (
    <View style={[S.badge,{backgroundColor:bg}]}>
      <View style={[S.badgeDot,{backgroundColor:color}]}/>
      <Text style={[S.badgeText,{color}]}>{children}</Text>
    </View>
  );
}

// ─── INPUT FIELD ──────────────────────────────────────────────────────────────
export function FInput({label,value,onChange,placeholder,error,secure,leftIcon,rightIcon,onRightPress,maxLen,th,hint}:{
  label?:string;value:string;onChange:(v:string)=>void;placeholder?:string;error?:string;
  secure?:boolean;leftIcon?:string;rightIcon?:string;onRightPress?:()=>void;maxLen?:number;th:AppTheme;hint?:string;
}) {
  const [f,setF]=useState(false);
  const bc=error?"#ef4444":f?th.orange:th.border;
  return (
    <View style={{gap:6}}>
      {label&&<Text style={[S.label,{color:th.muted}]}>{label}</Text>}
      <View>
        {leftIcon&&(
          <View style={S.leftIconWrap} pointerEvents="none">
            <Ionicons name={leftIcon as any} size={15} color={f?th.orange:th.muted}/>
          </View>
        )}
        <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
          placeholderTextColor={th.muted} secureTextEntry={secure} maxLength={maxLen}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={[S.input,{borderColor:bc,backgroundColor:th.inputBg,color:th.fg,
            paddingLeft:leftIcon?42:16,paddingRight:rightIcon?44:16},
            f&&{shadowColor:error?"#ef4444":th.orange,shadowOffset:{width:0,height:0},shadowOpacity:0.15,shadowRadius:6,elevation:2}]}/>
        {rightIcon&&(
          <TouchableOpacity style={S.rightIconWrap} onPress={onRightPress} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Ionicons name={rightIcon as any} size={15} color={th.muted}/>
          </TouchableOpacity>
        )}
      </View>
      {maxLen&&<Text style={[S.counter,{color:th.muted}]}>{value.length}/{maxLen}</Text>}
      {error&&<Text style={S.errorText}>⚠ {error}</Text>}
      {hint&&!error&&<Text style={[S.counter,{color:th.muted}]}>{hint}</Text>}
    </View>
  );
}

// ─── TEXTAREA ─────────────────────────────────────────────────────────────────
export function FTextarea({label,value,onChange,placeholder,rows=4,maxLen,th}:{
  label?:string;value:string;onChange:(v:string)=>void;placeholder?:string;rows?:number;maxLen?:number;th:AppTheme;
}) {
  const [f,setF]=useState(false);
  return (
    <View style={{gap:6}}>
      {label&&<Text style={[S.label,{color:th.muted}]}>{label}</Text>}
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={th.muted} multiline numberOfLines={rows}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)} maxLength={maxLen}
        style={[S.textarea,{borderColor:f?th.orange:th.border,backgroundColor:th.inputBg,color:th.fg},
          f&&{shadowColor:th.orange,shadowOffset:{width:0,height:0},shadowOpacity:0.15,shadowRadius:6,elevation:2}]}/>
      {maxLen&&<Text style={[S.counter,{color:th.muted}]}>{value.length}/{maxLen}</Text>}
    </View>
  );
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
export function FToggle({checked,onChange,label,th}:{checked:boolean;onChange:(v:boolean)=>void;label?:string;th:AppTheme}) {
  return (
    <TouchableOpacity onPress={()=>onChange(!checked)} activeOpacity={0.8}
      style={{flexDirection:"row",alignItems:"center",gap:12}}>
      {label&&<Text style={{flex:1,fontSize:14,color:th.fg}}>{label}</Text>}
      <View style={[S.track,{backgroundColor:checked?th.orange:th.border}]}>
        <View style={[S.thumb,{alignSelf:checked?"flex-end":"flex-start"}]}/>
      </View>
    </TouchableOpacity>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
export function HDivider({th}:{th:AppTheme}) {
  return <View style={{height:1,backgroundColor:th.border}}/>;
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
export function SLabel({children,action,onAction,th}:{children:string;action?:string;onAction?:()=>void;th:AppTheme}) {
  return (
    <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <Text style={[S.sLabel,{color:th.muted}]}>{children}</Text>
      {action&&<TouchableOpacity onPress={onAction}><Text style={{fontSize:13,fontWeight:"700",color:th.orange}}>{action}</Text></TouchableOpacity>}
    </View>
  );
}

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
export function SkelCard({th}:{th:AppTheme}) {
  const anim=useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    Animated.loop(Animated.sequence([
      Animated.timing(anim,{toValue:0.4,duration:800,useNativeDriver:true}),
      Animated.timing(anim,{toValue:1,duration:800,useNativeDriver:true}),
    ])).start();
  },[anim]);
  const lc=th.isDark?"#1a2d42":"#dde5f0";
  return (
    <Animated.View style={[S.skelCard,{backgroundColor:th.card,borderColor:th.border,opacity:anim}]}>
      <View style={{flex:1,gap:8}}>
        <View style={[S.skelLine,{width:"60%",backgroundColor:lc}]}/>
        <View style={[S.skelLine,{width:"38%",backgroundColor:lc}]}/>
      </View>
      <View style={[S.skelBadge,{backgroundColor:lc}]}/>
    </Animated.View>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function Empty({icon="clipboard-outline",title,sub,cta,onCta,th}:{icon?:string;title:string;sub?:string;cta?:string;onCta?:()=>void;th:AppTheme}) {
  return (
    <View style={S.emptyWrap}>
      <View style={[S.emptyBox,{backgroundColor:th.card2}]}>
        <Ionicons name={(icon || "clipboard-outline") as any} size={24} color={th.muted}/>
      </View>
      <Text style={[S.emptyTitle,{color:th.fg}]}>{title}</Text>
      {sub&&<Text style={[S.emptySub,{color:th.muted}]}>{sub}</Text>}
      {cta&&<Btn th={th} variant="ghost" size="sm" onPress={onCta}>{cta}</Btn>}
    </View>
  );
}

// ─── ACCENT CARD ──────────────────────────────────────────────────────────────
export function AccentCard({accent,children,onPress,th}:{accent:string;children:React.ReactNode;onPress?:()=>void;th:AppTheme}) {
  const inner=(
    <View style={[S.accentCard,{backgroundColor:th.card,borderColor:th.border,borderLeftColor:accent}]}>
      {children}
    </View>
  );
  if(onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{inner}</TouchableOpacity>;
  return inner;
}

// ─── MEMBER AVATAR ────────────────────────────────────────────────────────────
export function MemberAvatar({member,size=40,th}:{member:Member;size?:number;th:AppTheme}) {
  const bgs:Record<ClassRole,string>={owner:th.navy,rep:"#1a4a80",student:"#4a6080"};
  return (
    <View style={{width:size,height:size,borderRadius:size*0.28,backgroundColor:bgs[member.classRole],
      alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}>
      <Text style={{fontSize:size*0.34,fontWeight:"800",color:"#fff"}}>{getInitials(member.name)}</Text>
      {member.classRole!=="student"&&(
        <View style={{position:"absolute",bottom:-2,right:-2,width:size*0.35,height:size*0.35,
          borderRadius:999,backgroundColor:ROLE_META[member.classRole].color,
          borderWidth:2,borderColor:"#fff",alignItems:"center",justifyContent:"center"}}>
          <Ionicons name="star" size={size*0.17} color="#fff"/>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S=StyleSheet.create({
  badge:    {flexDirection:"row",alignItems:"center",gap:4,paddingVertical:3,paddingHorizontal:8,borderRadius:999,flexShrink:0},
  badgeDot: {width:5,height:5,borderRadius:999},
  badgeText:{fontSize:11,fontWeight:"700"},

  label:   {fontSize:11,fontWeight:"700",textTransform:"uppercase",letterSpacing:0.8},
  input:   {height:46,borderWidth:1.5,borderRadius:12,paddingVertical:12,fontSize:14},
  leftIconWrap: {position:"absolute",left:14,top:0,bottom:0,justifyContent:"center",zIndex:1},
  rightIconWrap:{position:"absolute",right:12,top:0,bottom:0,justifyContent:"center"},
  counter: {fontSize:11,textAlign:"right"},
  errorText:{fontSize:12,color:"#ef4444"},
  textarea:{borderWidth:1.5,borderRadius:12,padding:12,fontSize:14,textAlignVertical:"top",minHeight:90},

  track:   {width:44,height:24,borderRadius:12,padding:2,justifyContent:"center"},
  thumb:   {width:20,height:20,borderRadius:10,backgroundColor:"#fff",
    shadowColor:"#000",shadowOffset:{width:0,height:1},shadowOpacity:0.2,shadowRadius:2,elevation:2},

  sLabel:  {fontSize:11,fontWeight:"700",textTransform:"uppercase",letterSpacing:0.9},

  skelCard:{borderRadius:16,padding:16,flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,marginBottom:8},
  skelLine:{height:12,borderRadius:6},
  skelBadge:{width:58,height:22,borderRadius:11},

  emptyWrap: {alignItems:"center",paddingVertical:32,paddingHorizontal:20,gap:10},
  emptyBox:  {width:50,height:50,borderRadius:15,alignItems:"center",justifyContent:"center"},
  emptyTitle:{fontSize:15,fontWeight:"700",textAlign:"center"},
  emptySub:  {fontSize:13,textAlign:"center",lineHeight:19,maxWidth:200},

  accentCard:{borderRadius:16,borderWidth:1,borderLeftWidth:3,overflow:"hidden",
    shadowColor:"#0e2f5a",shadowOffset:{width:0,height:1},shadowOpacity:0.05,shadowRadius:4,elevation:1},
});
